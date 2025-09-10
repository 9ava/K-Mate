// src/features/places/places.controller.ts
import {
	Controller,
	Get,
	Post,
	Delete,
	Query,
	Param,
	Req,
	Res,
	UseGuards,
	ForbiddenException,
} from '@nestjs/common'
import type { Response, Request } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiOkResponse,
	ApiCookieAuth,
	ApiQuery,
	ApiParam,
	ApiBadRequestResponse,
} from '@nestjs/swagger'
import { PlacesService } from './places.service'
import { NearbyQueryDto, PhotoQueryDto, AdminAddPlaceDto } from './places.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'

@ApiTags('Places')
@Controller('places')
export class PlacesController {
	constructor(private readonly places: PlacesService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 주변 검색
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '주변 장소 검색 (Places v1: searchNearby)' })
	@ApiOkResponse({
		description: '간단 카드/마커용 목록',
		schema: {
			example: {
				success: true,
				data: [
					{
						placeId: 'ChIJ...',
						name: 'Gyeongbokgung',
						address: '...',
						lat: 37.57,
						lng: 126.98,
						photoName: 'places/..../photos/...',
					},
				],
			},
		},
	})
	@ApiQuery({ name: 'lat', required: true, type: Number })
	@ApiQuery({ name: 'lng', required: true, type: Number })
	@ApiQuery({ name: 'radius', required: false, type: Number, description: '미터(m), 기본 2000' })
	@ApiQuery({
		name: 'types',
		required: false,
		type: String,
		description: 'CSV (tourist_attraction,restaurant,cafe ...)',
	})
	@Get('nearby')
	async nearby(@Query() q: NearbyQueryDto) {
		const types = q.types
			? q.types
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: undefined
		const data = await this.places.searchNearby({ lat: q.lat, lng: q.lng, radius: q.radius, types })
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 상세 조회 (DB 없으면 동기화 후 반환)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '장소 상세 (DB 캐시 30일, 없으면 동기화)' })
	@ApiOkResponse({ description: 'Place 엔티티' })
	@ApiParam({ name: 'placeId', description: 'Google Place ID' })
	@Get(':placeId')
	async getDetail(@Param('placeId') placeId: string) {
		const data = await this.places.getOrSyncByPlaceId(placeId)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 사진 프록시 (리다이렉트)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사진 (v1 photo name → Google media로 302 redirect)' })
	@ApiOkResponse({ description: '이미지로 리다이렉트' })
	@ApiBadRequestResponse({ description: '쿼리 파라미터 누락' })
	@Get('photo')
	async getPhoto(@Query() q: PhotoQueryDto, @Res() res: Response) {
		if (!q.name) throw new ForbiddenException('photo name이 필요합니다.')
		const url = this.places.buildPhotoRedirectUrl(
			q.name,
			q.maxHeightPx ? { maxHeightPx: q.maxHeightPx } : undefined
		)
		return res.redirect(url)
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 관리자: placeId 수동 등록/갱신
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '관리자: placeId로 DB 등록/갱신' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Post('admin/add')
	async adminAdd(@Query() dto: AdminAddPlaceDto, @Req() req: Request) {
	const role = (req.user?.role ?? 'user') as 'user' | 'admin'
	const saved = await this.places.adminAddPlace(dto.placeId, role)
	return { success: true, data: saved }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 북마크 (로그인 필요)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '북마크 추가(토글 X) - 장소 전용' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Post(':placeId/bookmark')
	async addBookmark(@Param('placeId') placeId: string, @Req() req: Request) {
	const userId = req.user?.id as number
	if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
	const bm = await this.places.addBookmarkByGooglePlaceId(userId, placeId)
	return { success: true, data: { placeId: bm.place.googlePlaceId } }
	}

	@ApiOperation({ summary: '북마크 삭제 - 장소 전용' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Delete(':placeId/bookmark')
	async removeBookmark(@Param('placeId') placeId: string, @Req() req: Request) {
	const userId = req.user?.id as number
	if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
	await this.places.removeBookmarkByGooglePlaceId(userId, placeId)
	return { success: true }
	}

	@ApiOperation({ summary: '내 북마크 목록' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Get('bookmarks/me')
	async myBookmarks(@Req() req: Request) {
	const userId = req.user?.id as number
	if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
	const data = await this.places.listMyBookmarks(userId)
	return { success: true, data }
	}
}
