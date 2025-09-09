import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Place, PlaceType } from './place.entity'

/**
 * 장소 생성 DTO
 */
export interface CreatePlaceDto {
	type: PlaceType
	name: string
	description?: string
	lat: number
	lng: number
	address?: string
	phone?: string
	website?: string
}

/**
 * 장소 수정 DTO
 */
export interface UpdatePlaceDto {
	name?: string
	description?: string
	lat?: number
	lng?: number
	address?: string
	phone?: string
	website?: string
}

/**
 * 장소 조회 옵션
 */
export interface GetPlacesOptions {
	page?: number
	limit?: number
	type?: PlaceType
	search?: string
	lat?: number
	lng?: number
	radius?: number // 반경 (km)
}

/**
 * Place Service - 장소 비즈니스 로직 관리
 * 
 * 주요 기능:
 * - 장소 CRUD 작업
 * - 장소 타입별 관리 (travel, food, cafe)
 * - 위치 기반 검색
 * - 반경 내 장소 검색
 * - 페이지네이션
 */
@Injectable()
export class PlaceService {
	constructor(
		@InjectRepository(Place) private readonly placeRepository: Repository<Place>
	) {}

	/**
	 * 새로운 장소 생성
	 * @param createPlaceDto 장소 생성 데이터
	 * @returns 생성된 장소
	 */
	async createPlace(createPlaceDto: CreatePlaceDto): Promise<Place> {
		// 장소 엔티티 생성
		const place = this.placeRepository.create(createPlaceDto)

		// 데이터베이스에 저장
		return await this.placeRepository.save(place)
	}

	/**
	 * 장소 목록 조회 (페이지네이션 지원)
	 * @param options 조회 옵션
	 * @returns 장소 목록과 총 개수
	 */
	async getPlaces(options: GetPlacesOptions = {}): Promise<{ places: Place[]; total: number }> {
		const {
			page = 1,
			limit = 10,
			type,
			search,
			lat,
			lng,
			radius = 10, // 기본 반경 10km
		} = options

		// 쿼리 빌더 생성
		const queryBuilder = this.placeRepository.createQueryBuilder('place')

		// 장소 타입 필터
		if (type) {
			queryBuilder.andWhere('place.type = :type', { type })
		}

		// 검색 필터 (장소명 또는 설명에서 검색)
		if (search) {
			queryBuilder.andWhere(
				'(place.name LIKE :search OR place.description LIKE :search)',
				{ search: `%${search}%` }
			)
		}

		// 위치 기반 검색 (반경 내)
		if (lat && lng) {
			// Haversine 공식을 사용한 거리 계산
			const distanceQuery = `
				(6371 * acos(
					cos(radians(:lat)) * 
					cos(radians(place.lat)) * 
					cos(radians(place.lng) - radians(:lng)) + 
					sin(radians(:lat)) * 
					sin(radians(place.lat))
				))
			`
			
			queryBuilder
				.addSelect(distanceQuery, 'distance')
				.andWhere(`${distanceQuery} <= :radius`, { lat, lng, radius })
				.orderBy('distance', 'ASC')
		} else {
			// 기본 정렬 (최신순)
			queryBuilder.orderBy('place.created_at', 'DESC')
		}

		// 페이지네이션
		const skip = (page - 1) * limit
		queryBuilder.skip(skip).take(limit)

		// 실행
		const [places, total] = await queryBuilder.getManyAndCount()

		return { places, total }
	}

	/**
	 * ID로 장소 조회
	 * @param id 장소 ID
	 * @returns 장소 정보
	 */
	async getPlaceById(id: number): Promise<Place> {
		const place = await this.placeRepository.findOne({
			where: { id },
		})

		if (!place) {
			throw new NotFoundException('장소를 찾을 수 없습니다.')
		}

		return place
	}

	/**
	 * 장소 수정
	 * @param id 장소 ID
	 * @param updatePlaceDto 수정 데이터
	 * @returns 수정된 장소
	 */
	async updatePlace(id: number, updatePlaceDto: UpdatePlaceDto): Promise<Place> {
		const place = await this.placeRepository.findOne({
			where: { id },
		})

		if (!place) {
			throw new NotFoundException('장소를 찾을 수 없습니다.')
		}

		// 업데이트
		Object.assign(place, updatePlaceDto)
		return await this.placeRepository.save(place)
	}

	/**
	 * 장소 삭제
	 * @param id 장소 ID
	 */
	async deletePlace(id: number): Promise<void> {
		const place = await this.placeRepository.findOne({
			where: { id },
		})

		if (!place) {
			throw new NotFoundException('장소를 찾을 수 없습니다.')
		}

		await this.placeRepository.remove(place)
	}

	/**
	 * 장소 타입별 목록 조회
	 * @param type 장소 타입
	 * @param options 조회 옵션
	 * @returns 장소 목록
	 */
	async getPlacesByType(type: PlaceType, options: GetPlacesOptions = {}): Promise<{ places: Place[]; total: number }> {
		return this.getPlaces({ ...options, type })
	}

	/**
	 * 반경 내 장소 검색
	 * @param lat 위도
	 * @param lng 경도
	 * @param radius 반경 (km)
	 * @param options 조회 옵션
	 * @returns 장소 목록
	 */
	async getPlacesNearby(
		lat: number,
		lng: number,
		radius: number = 10,
		options: GetPlacesOptions = {}
	): Promise<{ places: Place[]; total: number }> {
		return this.getPlaces({ ...options, lat, lng, radius })
	}

	/**
	 * 두 지점 간의 거리 계산 (Haversine 공식)
	 * @param lat1 첫 번째 지점의 위도
	 * @param lng1 첫 번째 지점의 경도
	 * @param lat2 두 번째 지점의 위도
	 * @param lng2 두 번째 지점의 경도
	 * @returns 거리 (km)
	 */
	calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
		const R = 6371 // 지구 반지름 (km)
		const dLat = this.toRadians(lat2 - lat1)
		const dLng = this.toRadians(lng2 - lng1)
		
		const a = 
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
			Math.sin(dLng / 2) * Math.sin(dLng / 2)
		
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
		const distance = R * c
		
		return distance
	}

	/**
	 * 도를 라디안으로 변환
	 * @param degrees 도
	 * @returns 라디안
	 */
	private toRadians(degrees: number): number {
		return degrees * (Math.PI / 180)
	}
}
