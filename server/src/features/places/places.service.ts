// src/features/places/places.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { firstValueFrom } from 'rxjs'
import { Place } from './place.entity'
import { PlaceBookmark } from './place-bookmark.entity'
import { User } from '../users/user.entity'

/**
 * PlacesService
 * - Google Places API v1 호출을 담당
 * - DB 캐시(30일) 전략으로 place_id 중심 동기화
 * - 북마크 관리
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

	/**
	 * placeId로 상세 조회 후 DB upsert (30일 캐시)
	 * - 필요한 필드만 요청 (필드 마스크)
	 * - 네가 원한 매핑만 수행
	 */
	async getOrSyncByPlaceId(googlePlaceId: string): Promise<Place> {
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
		].join(',')

		const { data } = await firstValueFrom(
			this.http.get(`${this.base}/places/${googlePlaceId}`, { headers: this.headers(mask) })
		)

		const p = entity ?? this.placeRepo.create({ googlePlaceId })

		// ✅ 네가 명시한 필드만 동기화(값 없으면 기존 유지)
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
		p.lastSyncedAt = new Date()

		return await this.placeRepo.save(p)
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
	 * 관리자 전용: 특정 placeId를 DB에 수동 등록/갱신
	 */
	async adminAddPlace(googlePlaceId: string, userRole: 'user' | 'admin') {
		if (userRole !== 'admin') throw new ForbiddenException('관리자만 가능합니다.')
		return this.getOrSyncByPlaceId(googlePlaceId)
	}

	// -------------------------
	// 북마크 (장소 전용)
	// -------------------------

	/** 북마크 추가: 없으면 생성, 있으면 그대로 반환(idempotent) */
	async addBookmarkByGooglePlaceId(userId: number, googlePlaceId: string) {
	const place = await this.getOrSyncByPlaceId(googlePlaceId)
	// userId를 User 객체로 변환 필요
	const user = await this.userRepo.findOne({ where: { id: userId } })
	if (!user) throw new ForbiddenException('사용자 정보가 없습니다.')
	const exists = await this.bmRepo.findOne({ where: { user, place: { id: place.id } } })
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
	await this.bmRepo.delete({ user, place: { id: place.id } as any })
	}

	/** 내 북마크 목록 */
	async listMyBookmarks(userId: number) {
	const user = await this.userRepo.findOne({ where: { id: userId } })
	if (!user) return []
	const rows = await this.bmRepo.find({ where: { user }, order: { createdAt: 'DESC' } })
		return rows.map((r) => ({
			placeId: r.place.googlePlaceId,
			name: r.place.name,
			address: r.place.address,
			lat: r.place.lat,
			lng: r.place.lng,
			googleMapsUrl: r.place.googleMapsUrl,
			createdAt: r.createdAt,
		}))
	}
}
