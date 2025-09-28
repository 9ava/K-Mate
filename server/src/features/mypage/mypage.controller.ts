// src/features/mypage/mypage.controller.ts - 마이페이지 컨트롤러
import {
	Controller,
	Get,
	Put,
	Query,
	Req,
	UseGuards,
	ParseIntPipe,
	Body,
} from '@nestjs/common'
import type { Request } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiOkResponse,
	ApiCookieAuth,
	ApiQuery,
	ApiUnauthorizedResponse,
	ApiNotFoundResponse,
	ApiBadRequestResponse,
} from '@nestjs/swagger'
import { MypageService } from './mypage.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import {
	UserActivityStatsDto,
	PaginationQueryDto,
	BookmarkListResponseDto,
	ScrapListResponseDto,
	MyPostListResponseDto,
	MyCommentListResponseDto,
	UserProfileDto,
	MyCourseListResponseDto,
	SavedCourseListResponseDto,
	MyCourseCommentListResponseDto,
} from './mypage.dto'

@ApiTags('Mypage')
@Controller('mypage')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class MypageController {
	constructor(private readonly mypageService: MypageService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 사용자 활동 통계 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사용자 활동 통계 조회' })
	@ApiOkResponse({
		description: '사용자 활동 통계 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					bookmarkCount: 5,
					scrapCount: 12,
					postCount: 8,
					commentCount: 25,
					courseCount: 3,
					savedCourseCount: 7,
				},
			},
		},
	})
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('stats')
	async getUserActivityStats(@Req() req: Request): Promise<{ success: boolean; data: UserActivityStatsDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getUserActivityStats(userId)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 내 북마크 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '내 북마크 목록 조회' })
	@ApiOkResponse({
		description: '북마크 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					bookmarks: [
						{
							id: 1,
							placeId: 'ChIJ...',
							name: '경복궁',
							address: '서울특별시 종로구 사직로 161',
							lat: 37.5796,
							lng: 126.9770,
							googleMapsUrl: 'https://maps.google.com/...',
							type: 'travel',
							createdAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('bookmarks')
	async getMyBookmarks(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: BookmarkListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getMyBookmarks(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 내 스크랩 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '내 스크랩 목록 조회' })
	@ApiOkResponse({
		description: '스크랩 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					scraps: [
						{
							id: 1,
							postId: 123,
							title: '서울 맛집 추천',
							content: '서울에서 꼭 가봐야 할 맛집들을 소개합니다...',
							postType: 'community',
							category: 'food_review',
							author: {
								id: 456,
								name: '홍길동',
								avatarUrl: 'https://example.com/avatar.jpg',
							},
							createdAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('scraps')
	async getMyScraps(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: ScrapListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getMyScraps(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 내가 쓴 글 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '내가 쓴 글 목록 조회' })
	@ApiOkResponse({
		description: '내가 쓴 글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					posts: [
						{
							id: 123,
							title: '서울 맛집 추천',
							content: '서울에서 꼭 가봐야 할 맛집들을 소개합니다...',
							postType: 'community',
							category: 'food_review',
							status: 'published',
							likeCount: 15,
							commentCount: 8,
							createdAt: '2024-01-15T10:30:00Z',
							updatedAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('posts')
	async getMyPosts(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: MyPostListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getMyPosts(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 내가 쓴 댓글 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '내가 쓴 댓글 목록 조회' })
	@ApiOkResponse({
		description: '내가 쓴 댓글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					comments: [
						{
							id: 456,
							content: '정말 유용한 정보네요! 감사합니다.',
							post: {
								id: 123,
								title: '서울 맛집 추천',
								postType: 'community',
							},
							author: {
								id: 789,
								name: '홍길동',
								avatarUrl: 'https://example.com/avatar.jpg',
							},
							createdAt: '2024-01-15T10:30:00Z',
							updatedAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('comments')
	async getMyComments(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: MyCommentListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getMyComments(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 사용자 프로필 및 Role 확인 (RQ-7001)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사용자 프로필 및 Role 확인' })
	@ApiOkResponse({
		description: '사용자 프로필 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					id: 1,
					name: '홍길동',
					email: 'user@example.com',
					avatarUrl: 'https://example.com/avatar.jpg',
					role: 'user',
					emailVerified: true,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
			},
		},
	})
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('profile')
	async getUserProfile(@Req() req: Request): Promise<{ success: boolean; data: UserProfileDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getUserProfile(userId)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 내가 만든 코스 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '내가 만든 코스 목록 조회' })
	@ApiOkResponse({
		description: '내가 만든 코스 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					courses: [
						{
							id: '123',
							title: '서울 궁궐 투어',
							visibility: 'public',
							author: {
								id: 1,
								name: '홍길동',
								avatarUrl: 'https://example.com/avatar.jpg',
							},
							createdAt: '2024-01-15T10:30:00Z',
							updatedAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('courses')
	async getMyCourses(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: MyCourseListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getMyCourses(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 저장한 코스 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '저장한 코스 목록 조회' })
	@ApiOkResponse({
		description: '저장한 코스 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					savedCourses: [
						{
							id: 1,
							course: {
								id: '456',
								title: '부산 해운대 투어',
								visibility: 'public',
								author: {
									id: 2,
									name: '김철수',
									avatarUrl: 'https://example.com/avatar2.jpg',
								},
								createdAt: '2024-01-10T09:00:00Z',
								updatedAt: '2024-01-10T09:00:00Z',
							},
							savedAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('saved-courses')
	async getSavedCourses(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: SavedCourseListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getSavedCourses(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 내가 쓴 코스 댓글 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '내가 쓴 코스 댓글 목록 조회' })
	@ApiOkResponse({
		description: '내가 쓴 코스 댓글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					comments: [
						{
							id: 1,
							content: '정말 멋진 코스네요! 다음에 꼭 가보겠습니다.',
							course: {
								id: '123e4567-e89b-12d3-a456-426614174000',
								title: '서울 궁궐 투어',
								author: {
									id: 2,
									name: '김철수',
									avatarUrl: 'https://example.com/avatar2.jpg',
								},
							},
							author: {
								id: 1,
								name: '홍길동',
								avatarUrl: 'https://example.com/avatar.jpg',
							},
							createdAt: '2024-01-15T10:30:00Z',
							updatedAt: '2024-01-15T10:30:00Z',
						},
					],
					total: 1,
					page: 1,
					limit: 10,
				},
			},
		},
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10, 최대: 100)' })
	@ApiUnauthorizedResponse({ description: '로그인이 필요합니다' })
	@ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
	@Get('course-comments')
	async getMyCourseComments(
		@Req() req: Request,
		@Query() query: PaginationQueryDto
	): Promise<{ success: boolean; data: MyCourseCommentListResponseDto }> {
		const userId = (req.user as any)?.id as number
		const data = await this.mypageService.getMyCourseComments(userId, query)
		return { success: true, data }
	}

}
