import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Body,
	Query,
	UseGuards,
	Request,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { PlaceService } from './place.service'
import type { CreatePlaceDto, UpdatePlaceDto, GetPlacesOptions } from './place.service'
import { Place, PlaceType } from './place.entity'

/**
 * Place Controller - 장소 API 엔드포인트 관리
 * 
 * 주요 기능:
 * - 장소 CRUD API
 * - 장소 타입별 조회 (travel, food, cafe)
 * - 위치 기반 검색
 * - 반경 내 장소 검색
 * - 페이지네이션
 * - 권한 기반 접근 제어
 */
@Controller('places')
export class PlaceController {
	constructor(private readonly placeService: PlaceService) {}

	/**
	 * 새로운 장소 생성
	 * POST /places
	 * 인증 필요: JWT 쿠키 인증 (관리자만)
	 */
	@Post()
	@UseGuards(AuthGuard('jwt-cookie'))
	async createPlace(@Body() createPlaceDto: CreatePlaceDto, @Request() req: any): Promise<Place> {
		// 관리자 권한 확인
		if (req.user.role !== 'admin') {
			throw new Error('관리자만 장소를 생성할 수 있습니다.')
		}
		
		return await this.placeService.createPlace(createPlaceDto)
	}

	/**
	 * 장소 목록 조회 (페이지네이션 지원)
	 * GET /places?page=1&limit=10&type=travel&search=서울&lat=37.5665&lng=126.9780&radius=5
	 */
	@Get()
	async getPlaces(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('type') type?: string,
		@Query('search') search?: string,
		@Query('lat') lat?: string,
		@Query('lng') lng?: string,
		@Query('radius') radius?: string
	): Promise<{ places: Place[]; total: number; page: number; limit: number }> {
		const options: GetPlacesOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			type: type as PlaceType,
			search,
			lat: lat ? parseFloat(lat) : undefined,
			lng: lng ? parseFloat(lng) : undefined,
			radius: radius ? parseFloat(radius) : undefined,
		}

		const result = await this.placeService.getPlaces(options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 특정 장소 조회
	 * GET /places/:id
	 */
	@Get(':id')
	async getPlaceById(@Param('id', ParseIntPipe) id: number): Promise<Place> {
		return await this.placeService.getPlaceById(id)
	}

	/**
	 * 장소 수정
	 * PUT /places/:id
	 * 인증 필요: JWT 쿠키 인증 (관리자만)
	 */
	@Put(':id')
	@UseGuards(AuthGuard('jwt-cookie'))
	async updatePlace(
		@Param('id', ParseIntPipe) id: number,
		@Body() updatePlaceDto: UpdatePlaceDto,
		@Request() req: any
	): Promise<Place> {
		// 관리자 권한 확인
		if (req.user.role !== 'admin') {
			throw new Error('관리자만 장소를 수정할 수 있습니다.')
		}
		
		return await this.placeService.updatePlace(id, updatePlaceDto)
	}

	/**
	 * 장소 삭제
	 * DELETE /places/:id
	 * 인증 필요: JWT 쿠키 인증 (관리자만)
	 */
	@Delete(':id')
	@UseGuards(AuthGuard('jwt-cookie'))
	@HttpCode(HttpStatus.NO_CONTENT)
	async deletePlace(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<void> {
		// 관리자 권한 확인
		if (req.user.role !== 'admin') {
			throw new Error('관리자만 장소를 삭제할 수 있습니다.')
		}
		
		await this.placeService.deletePlace(id)
	}

	/**
	 * 장소 타입별 목록 조회
	 * GET /places/type/:type
	 */
	@Get('type/:type')
	async getPlacesByType(
		@Param('type') type: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string
	): Promise<{ places: Place[]; total: number; page: number; limit: number }> {
		const options: GetPlacesOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			search,
		}

		const result = await this.placeService.getPlacesByType(type as PlaceType, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 반경 내 장소 검색
	 * GET /places/nearby?lat=37.5665&lng=126.9780&radius=5&type=travel
	 */
	@Get('nearby')
	async getPlacesNearby(
		@Query('lat') lat: string,
		@Query('lng') lng: string,
		@Query('radius') radius?: string,
		@Query('type') type?: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	): Promise<{ places: Place[]; total: number; page: number; limit: number }> {
		const options: GetPlacesOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			type: type as PlaceType,
		}

		const result = await this.placeService.getPlacesNearby(
			parseFloat(lat),
			parseFloat(lng),
			radius ? parseFloat(radius) : 10,
			options
		)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 두 지점 간의 거리 계산
	 * GET /places/distance?lat1=37.5665&lng1=126.9780&lat2=37.5512&lng2=126.9882
	 */
	@Get('distance')
	async calculateDistance(
		@Query('lat1') lat1: string,
		@Query('lng1') lng1: string,
		@Query('lat2') lat2: string,
		@Query('lng2') lng2: string
	): Promise<{ distance: number }> {
		const distance = this.placeService.calculateDistance(
			parseFloat(lat1),
			parseFloat(lng1),
			parseFloat(lat2),
			parseFloat(lng2)
		)
		
		return { distance }
	}
}
