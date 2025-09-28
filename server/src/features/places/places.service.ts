// src/features/places/places.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { firstValueFrom } from 'rxjs'
import { Place } from './place.entity'
import { PlaceBookmark } from './place-bookmark.entity'
import { User } from '../users/user.entity'
import { AdminAddPlaceDto, UserAddPlaceDto } from './places.dto'

/**
 * PlacesService
 * - Google Places API v1 연동
 * - DB 캐시(30일) 기반 동기화
 * - 카테고리 자동/수동 분류 (type, typeSource)
 * - 장소 북마크 (User ↔ Place 관계)
 */
@Injectable()
export class PlacesService {
	/** Places API v1 엔드포인트 루트 */
	private readonly base = 'https://places.googleapis.com/v1'

	constructor(
		private readonly http: HttpService,
		@InjectRepository(Place) private readonly placeRepo: Repository<Place>,
		@InjectRepository(PlaceBookmark) private readonly bmRepo: Repository<PlaceBookmark>,
		@InjectRepository(User) private readonly userRepo: Repository<User>
	) {}

	/** 공통 헤더: API 키 + 필드 마스크 */
	private headers(fieldMask: string) {
		return {
			'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
			'X-Goog-FieldMask': fieldMask,
		}
	}

	// ─────────────────────────────────────────────────────────
	// 구글 types → 표준 카테고리 매핑
	// 우선순위: food → cafe → travel
	// ─────────────────────────────────────────────────────────
	private static TYPE_MAP = {
		food: new Set(['restaurant', 'meal_takeaway', 'meal_delivery', 'bar', 'bakery']),
		cafe: new Set(['cafe', 'coffee_shop']),
		travel: new Set([
			'tourist_attraction',
			'museum',
			'art_gallery',
			'amusement_park',
			'zoo',
			'aquarium',
			'park',
			'natural_feature',
			'campground',
			'hiking_area',
			'rv_park',
			'palace',
			'temple',
			'church',
			'mosque',
			'synagogue',
			'city_hall',
			'landmark',
		]),
	}

	private mapGoogleTypesToCategory(
		googleTypes?: string[] | null
	): 'travel' | 'food' | 'cafe' | null {
		if (!googleTypes || googleTypes.length === 0) return null
		const t = new Set(googleTypes)
		if ([...PlacesService.TYPE_MAP.food].some((x) => t.has(x))) return 'food'
		if ([...PlacesService.TYPE_MAP.cafe].some((x) => t.has(x))) return 'cafe'
		if ([...PlacesService.TYPE_MAP.travel].some((x) => t.has(x))) return 'travel'
		return 'travel' // 기본값
	}

	/**
	 * Validates if a string is a proper Google Place ID
	 * Google Place IDs typically start with "ChIJ", "EhIJ", "GhIJ", etc.
	 * or are longer alphanumeric strings (not just numeric like "85")
	 */
	private isValidGooglePlaceId(placeId: string): boolean {
		// Basic validation: should be longer than 10 chars and not just numeric
		if (!placeId || placeId.length < 10 || /^\d+$/.test(placeId)) {
			return false
		}
		// Additional check for common Google Place ID prefixes
		return /^[A-Za-z0-9_-]+$/.test(placeId)
	}

	/**
	 * placeId 상세 조회 후 DB upsert (30일 캐시)
	 * - 필요한 필드만 요청 (필드 마스크)
	 * - 지정 필드 매핑 + (관리자 고정이 아니면) 자동 카테고리 분류
	 */
	async getOrSyncByPlaceId(googlePlaceId: string): Promise<Place> {
		// Validate Google Place ID format
		if (!this.isValidGooglePlaceId(googlePlaceId)) {
			console.log(`Invalid Google Place ID format: ${googlePlaceId}`)
			// Return a placeholder Place object for invalid IDs
			const fallbackPlace = this.placeRepo.create({
				googlePlaceId,
				type: null,
				name: `Unknown Place (${googlePlaceId})`,
				address: 'Address not available',
				lat: 0,
				lng: 0,
				isAdvertisement: false,
				phone: null,
				website: null,
				googleMapsUrl: null,
				openingHoursJson: null,
				photosJson: null,
				sourceTypesJson: null,
				typeSource: 'auto',
				description: 'This place information is not available due to invalid place ID',
				lastSyncedAt: new Date(),
			})
			// Save the fallback to avoid repeated API calls
			return await this.placeRepo.save(fallbackPlace)
		}

		let entity = await this.placeRepo.findOne({ where: { googlePlaceId } })

		const needsRefresh =
			!entity?.lastSyncedAt ||
			Date.now() - +new Date(entity.lastSyncedAt) > 1000 * 60 * 60 * 24 * 30

		if (!needsRefresh) return entity!

		// 필요한 필드만 마스크 (요금/성능 절약)
		const mask = [
			'id', // place_id
			'displayName', // name
			'formattedAddress', // address
			'location', // lat/lng
			'internationalPhoneNumber', // phone
			'websiteUri', // website
			'googleMapsUri', // googleMapsUrl
			'currentOpeningHours', // openingHoursJson
			'photos', // photosJson
			'editorialSummary', // description
			'types', // 원본 구글 타입 목록
		].join(',')

		try {
			const { data } = await firstValueFrom(
				this.http.get(`${this.base}/places/${googlePlaceId}`, { headers: this.headers(mask) })
			)

			const p = entity ?? this.placeRepo.create({ googlePlaceId })

			// ✅ 지정 필드만 동기화(값 없으면 기존 유지)
			p.name = data.displayName?.text ?? p.name
			p.address = data.formattedAddress ?? p.address
			p.lat = data.location?.latitude ?? p.lat
			p.lng = data.location?.longitude ?? p.lng
			p.phone = data.internationalPhoneNumber ?? p.phone
			p.website = data.websiteUri ?? p.website
			p.googleMapsUrl = data.googleMapsUri ?? p.googleMapsUrl
			p.openingHoursJson = data.currentOpeningHours ?? p.openingHoursJson
			p.photosJson = data.photos ?? p.photosJson
			p.description = data.editorialSummary?.text ?? p.description

			// 원본 구글 types 보관 + 자동 분류
			if ('sourceTypesJson' in p) {
				// 엔티티에 컬럼이 있다면 채움(마이그레이션 반영된 경우)
				// @ts-ignore - 동적 접근 허용
				p.sourceTypesJson = data.types ?? p.sourceTypesJson
			}
			if ('typeSource' in p) {
				// @ts-ignore
				if (p.typeSource !== 'admin') {
					const cat = this.mapGoogleTypesToCategory(data.types)
					if (cat) {
						// @ts-ignore
						p.type = cat
					}
					// @ts-ignore
					p.typeSource = 'auto'
				}
			}

			p.lastSyncedAt = new Date()
			return await this.placeRepo.save(p)
		} catch (error) {
			console.error(`Failed to fetch Google Place details for ${googlePlaceId}:`, error)

			// If entity exists, return it as is (stale cache is better than nothing)
			if (entity) {
				console.log(`Returning existing cached data for ${googlePlaceId}`)
				return entity
			}

			// Create a fallback Place object with basic info
			const fallbackPlace = this.placeRepo.create({
				googlePlaceId,
				type: null,
				name: `Place ${googlePlaceId}`,
				address: 'Address not available',
				lat: 0,
				lng: 0,
				isAdvertisement: false,
				phone: null,
				website: null,
				googleMapsUrl: null,
				openingHoursJson: null,
				photosJson: null,
				sourceTypesJson: null,
				typeSource: 'auto',
				description: 'Place details temporarily unavailable',
				lastSyncedAt: new Date(),
			})

			return await this.placeRepo.save(fallbackPlace)
		}
	}

	/**
	 * 텍스트 검색: lat/lng 기준으로 텍스트 검색 (다국어 지원)
	 * - v1 searchText 사용
	 * - 검색어와 언어 코드를 받아서 해당 언어로 결과 반환
	 */
	async searchText(params: { 
		query: string; 
		lat?: number; 
		lng?: number; 
		radius?: number; 
		language?: string;
		maxResults?: number;
	}) {
		const body: any = {
			textQuery: params.query,
			maxResultCount: params.maxResults ?? 20,
			languageCode: params.language ?? 'en',
		}

		// 위치 기반 검색이면 지역 제한 추가
		if (params.lat && params.lng) {
			body.locationBias = {
				circle: {
					center: { latitude: params.lat, longitude: params.lng },
					radius: params.radius ?? 5000,
				},
			}
		} else {
			// 한국 지역으로 제한
			body.regionCode = 'KR'
		}

		const mask =
			'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.photos'
		
		try {
			const { data } = await firstValueFrom(
				this.http.post(`${this.base}/places:searchText`, body, { headers: this.headers(mask) })
			)

			return (data.places ?? []).map((p: any) => ({
				placeId: p.id,
				name: p.displayName?.text,
				address: p.formattedAddress,
				lat: p.location?.latitude,
				lng: p.location?.longitude,
				photoName: p.photos?.[0]?.name ?? null,
				types: p.types ?? [],
			}))
		} catch (error) {
			console.error('Failed to search text:', error)
			return []
		}
	}

	/**
	 * 주변검색: lat/lng 기준 place 카드 데이터
	 * - v1 searchNearby 사용
	 * - place_id/이름/주소/좌표/사진 첫장만 반환
	 */
	async searchNearby(params: { lat: number; lng: number; radius?: number; types?: string[] }) {
		const body: any = {
			maxResultCount: 20,
			locationRestriction: {
				circle: {
					center: { latitude: params.lat, longitude: params.lng },
					radius: params.radius ?? 2000,
				},
			},
		}
		if (params.types?.length) body.includedTypes = params.types

		const mask =
			'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.photos'
		const { data } = await firstValueFrom(
			this.http.post(`${this.base}/places:searchNearby`, body, { headers: this.headers(mask) })
		)

		return (data.places ?? []).map((p: any) => ({
			placeId: p.id,
			name: p.displayName?.text,
			address: p.formattedAddress,
			lat: p.location?.latitude,
			lng: p.location?.longitude,
			photoName: p.photos?.[0]?.name ?? null, // v1 photo resource name
		}))
	}

	/**
	 * v1 Photos API: media URL 생성 (리다이렉트에 사용)
	 * - Google이 Content-Type/캐시를 알아서 내려주므로 302 redirect 권장
	 */
	buildPhotoRedirectUrl(photoName: string, opts?: { maxWidthPx?: number; maxHeightPx?: number }) {
		const qs = new URLSearchParams()
		if (opts?.maxWidthPx) qs.set('maxWidthPx', String(opts.maxWidthPx))
		if (opts?.maxHeightPx) qs.set('maxHeightPx', String(opts.maxHeightPx))
		qs.set('key', process.env.GOOGLE_MAPS_API_KEY!)
		return `${this.base}/${photoName}/media?${qs.toString()}`
	}

	/**
	 * 사용자: 새 장소 추가 (로그인 필요)
	 */
	async userAddPlace(dto: UserAddPlaceDto, userId: number) {
		// First, get the latest data from Google and sync it
		const place = await this.getOrSyncByPlaceId(dto.placeId)

		// Now, override with user-provided data
		if (dto.name) {
			place.name = dto.name
		}
		if (dto.description) {
			place.description = dto.description
		}
		if (dto.imageUrl) {
			// Assuming the photosJson is an array of objects with a 'url' property
			place.photosJson = [{ url: dto.imageUrl }];
		}
		if (dto.category) {
			const categoryMap: Record<string, 'travel' | 'food' | 'cafe'> = {
				'K-Travel': 'travel',
				'K-Food': 'food',
				'K-Cafe': 'cafe',
			}
			place.type = categoryMap[dto.category] || null
			place.typeSource = 'user'
		}

		return this.placeRepo.save(place)
	}

	/**
	 * 관리자 전용: 특정 placeId를 DB에 수동 등록/갱신
	 */
	async adminAddPlace(dto: AdminAddPlaceDto, userRole: 'user' | 'admin') {
		if (userRole !== 'admin') throw new ForbiddenException('관리자만 가능합니다.')

		// First, get the latest data from Google and sync it
		const place = await this.getOrSyncByPlaceId(dto.placeId)

		// Now, override with admin-provided data
		if (dto.name) {
			place.name = dto.name
		}
		if (dto.description) {
			place.description = dto.description
		}
		if (dto.imageUrl) {
			// Assuming the photosJson is an array of objects with a 'url' property
			place.photosJson = [{ url: dto.imageUrl }];
		}
		if (dto.category) {
			const categoryMap: Record<string, 'travel' | 'food' | 'cafe'> = {
				'K-Travel': 'travel',
				'K-Food': 'food',
				'K-Cafe': 'cafe',
			}
			place.type = categoryMap[dto.category] || null
			place.typeSource = 'admin'
		}

		return this.placeRepo.save(place)
	}

	// ─────────────────────────────────────────────────────────
	// 목록/검색/필터/페이지네이션 (DB 저장분)
	// ─────────────────────────────────────────────────────────
	async listPlaces(opts: {
		page?: number
		pageSize?: number
		q?: string
		type?: 'travel' | 'food' | 'cafe'
	}) {
		const page = opts.page ?? 1
		const take = opts.pageSize ?? 20

		const qb = this.placeRepo
			.createQueryBuilder('p')
			.orderBy('p.createdAt', 'DESC')
			.skip((page - 1) * take)
			.take(take)

		// Filter out invalid "Unknown Place" entries
		qb.andWhere('p.name NOT LIKE :unknownPattern', { unknownPattern: 'Unknown Place%' })
		qb.andWhere('(p.lat != 0 OR p.lng != 0)') // Exclude places with invalid coordinates

		if (opts.q) {
			qb.andWhere('(p.name LIKE :q OR p.address LIKE :q)', { q: `%${opts.q}%` })
		}
		if (opts.type) {
			qb.andWhere('p.type = :type', { type: opts.type })
		}

		const [items, total] = await qb.getManyAndCount()
		return { items, total, page, pageSize: take }
	}

	// ─────────────────────────────────────────────────────────
	// 관리자: 카테고리 수동 지정/고정
	// (엔티티에 type/typeSource 컬럼이 있을 때 사용)
	// ─────────────────────────────────────────────────────────
	async setTypeByAdmin(googlePlaceId: string, type: 'travel' | 'food' | 'cafe') {
		const place = await this.placeRepo.findOne({ where: { googlePlaceId } })
		if (!place) throw new NotFoundException('place not found')

		// @ts-ignore - 컬럼이 존재하는 스키마인 경우에만
		place.type = type
		// @ts-ignore
		place.typeSource = 'admin'

		await this.placeRepo.save(place)
		return place
	}

	// ─────────────────────────────────────────────────────────
	// 북마크 (장소 전용) — User/Place 엔티티 관계 사용
	// ─────────────────────────────────────────────────────────

	/** 북마크 추가: 없으면 생성, 있으면 그대로 반환(idempotent) */
	async addBookmarkByGooglePlaceId(userId: number, googlePlaceId: string) {
		const place = await this.getOrSyncByPlaceId(googlePlaceId)

		// userId → User 엔티티
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new ForbiddenException('사용자 정보가 없습니다.')

		// 중복 체크
		const exists = await this.bmRepo.findOne({
			where: { user: { id: user.id }, place: { id: place.id } },
			relations: { user: true, place: true },
		})
		if (exists) return exists

		const bm = this.bmRepo.create({ user, place })
		return this.bmRepo.save(bm)
	}

	/** 북마크 해제 (idempotent) */
	async removeBookmarkByGooglePlaceId(userId: number, googlePlaceId: string) {
		const place = await this.placeRepo.findOne({ where: { googlePlaceId } })
		if (!place) return

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) return

		const bm = await this.bmRepo.findOne({
			where: { user: { id: user.id }, place: { id: place.id } },
			relations: { user: true, place: true },
		})
		if (bm) {
			await this.bmRepo.remove(bm)
		}
	}

	/** 내 북마크 목록 */
	async listMyBookmarks(userId: number) {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) return []

		const rows = await this.bmRepo.find({
			where: { user: { id: user.id } },
			relations: { place: true },
			order: { createdAt: 'DESC' },
		})

		return rows.map((r) => ({
			placeId: r.place.googlePlaceId,
			name: r.place.name,
			address: r.place.address,
			lat: r.place.lat,
			lng: r.place.lng,
			googleMapsUrl: r.place.googleMapsUrl,
			// 엔티티에 type이 있으면 포함
			// @ts-ignore
			type: 'type' in r.place ? r.place.type : undefined,
			createdAt: r.createdAt,
		}))
	}

	/** 관리자: 장소 삭제 */
	async deletePlace(id: number): Promise<void> {
		const place = await this.placeRepo.findOne({ where: { id } })
		if (!place) {
			throw new Error('Place not found')
		}

		// Remove any bookmarks for this place first
		const bookmarks = await this.bmRepo.find({ where: { place: { id } } })
		if (bookmarks.length > 0) {
			await this.bmRepo.remove(bookmarks)
		}

		// Remove the place
		await this.placeRepo.remove(place)
	}

	/** 관리자: 광고 상태 토글 */
	async toggleAdvertisement(id: number, isAdvertisement: boolean): Promise<Place> {
		const place = await this.placeRepo.findOne({ where: { id } })
		if (!place) {
			throw new NotFoundException('Place not found')
		}

		place.isAdvertisement = isAdvertisement
		return await this.placeRepo.save(place)
	}

	/** 관리자: 다국어 메뉴판 지원 상태 토글 */
	async toggleMultilingualMenu(id: number, hasMultilingualMenu: boolean): Promise<Place> {
		const place = await this.placeRepo.findOne({ where: { id } })
		if (!place) {
			throw new NotFoundException('Place not found')
		}

		place.hasMultilingualMenu = hasMultilingualMenu
		return await this.placeRepo.save(place)
	}
}
