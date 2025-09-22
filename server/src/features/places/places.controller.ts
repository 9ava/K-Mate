// src/features/places/places.controller.ts
import {
	Controller,
	Get,
	Post,
	Delete,
	Put,
	Query,
	Param,
	Body,
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
import {
	NearbyQueryDto,
	PhotoQueryDto,
	AdminAddPlaceDto,
	UserAddPlaceDto,
	ListQueryDto,
	SetTypeDto,
} from './places.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'

@ApiTags('Places')
@Controller('places')
export class PlacesController {
	constructor(private readonly places: PlacesService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 목록: DB 저장분 (카테고리/검색/페이지네이션)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: 'DB 장소 목록 (카테고리/검색/페이지네이션)' })
	@ApiOkResponse({
		schema: { example: { success: true, data: { items: [], total: 0, page: 1, pageSize: 20 } } },
	})
	@ApiQuery({ name: 'type', required: false, enum: ['travel', 'food', 'cafe'] })
	@ApiQuery({ name: 'q', required: false })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'pageSize', required: false, type: Number })
	@Get()
	async list(@Query() q: ListQueryDto) {
		const data = await this.places.listPlaces(q)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 주변 검색 (Google v1 searchNearby)
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
						photoName: 'places/.../photos/...',
					},
				],
			},
		},
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
	// 상세 (DB 캐시 30일, 없으면 동기화)
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
	// 사용자: 새 장소 추가 (로그인 필요)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '새 장소 추가 (로그인 필요)' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Post('add')
	async addPlace(@Body() dto: UserAddPlaceDto, @Req() req: Request) {
		const userId = (req.user as any)?.id as number
		if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
		const saved = await this.places.userAddPlace(dto, userId)
		return { success: true, data: saved }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 관리자: placeId 수동 등록/갱신
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '관리자: placeId로 DB 등록/갱신' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Post('admin/add')
	async adminAdd(@Body() dto: AdminAddPlaceDto, @Req() req: Request) {
		const role = (req.user?.role ?? 'user') as 'user' | 'admin'
		const saved = await this.places.adminAddPlace(dto, role)
		return { success: true, data: saved }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 관리자: 카테고리 수동 지정/고정
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '관리자: 장소 카테고리 수동 지정/고정' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Put(':placeId/type')
	async setType(@Param('placeId') placeId: string, @Body() body: SetTypeDto) {
		const p = await this.places.setTypeByAdmin(placeId, body.type)
		return {
			success: true,
			data: { placeId: p.googlePlaceId, type: p.type, typeSource: p.typeSource },
		}
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 관리자: 장소 삭제
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '관리자: 장소 삭제' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Delete('admin/:id')
	async adminDeletePlace(@Param('id') id: number) {
		await this.places.deletePlace(id)
		return { success: true }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 북마크 (로그인 필요)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '북마크 추가(토글 아님) - 장소 전용' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Post(':placeId/bookmark')
	async addBookmark(@Param('placeId') placeId: string, @Req() req: Request) {
		const userId = (req.user as any)?.id as number // ★ 내부 PK를 JWT에 넣어두어야 함
		if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
		const bm = await this.places.addBookmarkByGooglePlaceId(userId, placeId)
		return { success: true, data: { placeId: bm.place.googlePlaceId } }
	}

	@ApiOperation({ summary: '북마크 삭제 - 장소 전용' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Delete(':placeId/bookmark')
	async removeBookmark(@Param('placeId') placeId: string, @Req() req: Request) {
		const userId = (req.user as any)?.id as number
		if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
		await this.places.removeBookmarkByGooglePlaceId(userId, placeId)
		return { success: true }
	}

	@ApiOperation({ summary: '내 북마크 목록' })
	@ApiCookieAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@Get('bookmarks/me')
	async myBookmarks(@Req() req: Request) {
		const userId = (req.user as any)?.id as number
		if (!userId) throw new ForbiddenException('로그인이 필요합니다.')
		const data = await this.places.listMyBookmarks(userId)
		return { success: true, data }
	}
}
