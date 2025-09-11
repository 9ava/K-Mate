// src/features/posts/posts.controller.ts
import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Query,
	Param,
	Body,
	Req,
	UseGuards,
	ParseIntPipe,
} from '@nestjs/common'
import type { Request } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiOkResponse,
	ApiCookieAuth,
	ApiQuery,
	ApiParam,
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiForbiddenResponse,
} from '@nestjs/swagger'
import { PostsService } from './posts.service'
import { CreatePostDto, UpdatePostDto, GetPostsQueryDto, PostResponseDto } from './posts.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
	constructor(private readonly postsService: PostsService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글 생성
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글 생성' })
	@ApiOkResponse({
		description: '게시글 생성 성공',
		type: PostResponseDto,
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiForbiddenResponse({ description: '권한 없음 (tips/trend는 관리자만)' })
	@ApiCookieAuth('access_token')
	@Post()
	@UseGuards(JwtAuthGuard)
	async createPost(@Req() req: Request, @Body() createPostDto: CreatePostDto) {
		const userId = (req.user as any).sub
		const data = await this.postsService.createPost(userId, createPostDto)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글 목록 조회 (페이지네이션, 필터링, 검색)' })
	@ApiOkResponse({
		description: '게시글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					posts: [
						{
							id: 1,
							author: { id: 1, name: '홍길동', avatarUrl: null, role: 'user' },
							title: '서울 맛집 추천',
							content: '서울에서 꼭 가봐야 할 맛집들을 소개합니다.',
							postType: 'community',
							category: 'food_review',
							status: 'published',
							viewCount: 10,
							likeCount: 5,
							scrapCount: 3,
							commentCount: 2,
							createdAt: '2024-01-01T00:00:00.000Z',
							updatedAt: '2024-01-01T00:00:00.000Z'
						}
					],
					total: 1
				}
			}
		}
	})
	@ApiQuery({ name: 'postType', required: false, enum: ['community', 'tips', 'trend'] })
	@ApiQuery({ name: 'category', required: false, enum: ['travel_tip', 'food_review', 'cafe_review', 'general'] })
	@ApiQuery({ name: 'status', required: false, enum: ['published', 'draft', 'hidden'] })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10)' })
	@ApiQuery({ name: 'search', required: false, type: String, description: '검색 키워드' })
	@Get()
	async getPosts(@Query() query: GetPostsQueryDto) {
		const data = await this.postsService.getPosts(query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글 상세 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글 상세 조회 (조회수 증가)' })
	@ApiOkResponse({
		description: '게시글 상세 조회 성공',
		type: PostResponseDto,
	})
	@ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
	@ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
	@Get(':id')
	async getPostById(@Param('id', ParseIntPipe) id: number) {
		const data = await this.postsService.getPostById(id)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글 수정
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글 수정' })
	@ApiOkResponse({
		description: '게시글 수정 성공',
		type: PostResponseDto,
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '권한 없음 (작성자만 또는 tips/trend는 관리자만)' })
	@ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
	@ApiCookieAuth('access_token')
	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async updatePost(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: Request,
		@Body() updatePostDto: UpdatePostDto
	) {
		const userId = (req.user as any).sub
		const data = await this.postsService.updatePost(id, userId, updatePostDto)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글 삭제
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글 삭제' })
	@ApiOkResponse({
		description: '게시글 삭제 성공',
		schema: {
			example: {
				success: true,
				message: '게시글이 삭제되었습니다.'
			}
		}
	})
	@ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '권한 없음 (작성자만 또는 tips/trend는 관리자만)' })
	@ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
	@ApiCookieAuth('access_token')
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async deletePost(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
		const userId = (req.user as any).sub
		await this.postsService.deletePost(id, userId)
		return { success: true, message: '게시글이 삭제되었습니다.' }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// K-Buzz 게시글 목록 조회 (프론트엔드 호환)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: 'K-Buzz 게시글 목록 조회 (프론트엔드 호환)' })
	@ApiOkResponse({
		description: 'K-Buzz 게시글 목록 조회 성공',
		schema: {
			example: {
				buzzes: [
					{
						id: 1,
						title: '서울 맛집 추천',
						content: '서울에서 꼭 가봐야 할 맛집들을 소개합니다.',
						category: 'food',
						image_url: null,
						latitude: null,
						longitude: null,
						location_name: null,
						like_count: 5,
						comment_count: 2,
						view_count: 15,
						status: 'published',
						user_id: 2,
						user: {
							id: 2,
							name: '홍길동',
							email: 'user1@kmate.com',
							avatar_url: 'https://example.com/user1.jpg'
						},
						created_at: '2024-01-01T00:00:00.000Z',
						updated_at: '2024-01-01T00:00:00.000Z'
					}
				],
				total: 1,
				page: 1,
				limit: 10
			}
		}
	})
	@ApiQuery({ name: 'category', required: false, enum: ['travel', 'food', 'cafe', 'culture', 'shopping', 'nature', 'activity', 'other'] })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10)' })
	@ApiQuery({ name: 'search', required: false, type: String, description: '검색 키워드' })
	@Get('buzz')
	async getBuzzPosts(@Query() query: any) {
		const data = await this.postsService.getBuzzPosts(query)
		return data
	}

	// ────────────────────────────────────────────────────────────────────────────
	// K-Buzz 게시글 좋아요
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: 'K-Buzz 게시글 좋아요' })
	@ApiOkResponse({
		description: '좋아요 성공',
		schema: {
			example: {
				success: true,
				message: '좋아요가 추가되었습니다.'
			}
		}
	})
	@ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
	@ApiCookieAuth('access_token')
	@Post('buzz/:id/like')
	@UseGuards(JwtAuthGuard)
	async likeBuzzPost(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
		const userId = (req.user as any).sub
		await this.postsService.likePost(id, userId)
		return { success: true, message: '좋아요가 추가되었습니다.' }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 사용자별 게시글 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사용자별 게시글 조회' })
	@ApiOkResponse({
		description: '사용자별 게시글 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					posts: [],
					total: 0
				}
			}
		}
	})
	@ApiParam({ name: 'userId', type: Number, description: '사용자 ID' })
	@ApiQuery({ name: 'postType', required: false, enum: ['community', 'tips', 'trend'] })
	@ApiQuery({ name: 'category', required: false, enum: ['travel_tip', 'food_review', 'cafe_review', 'general'] })
	@ApiQuery({ name: 'status', required: false, enum: ['published', 'draft', 'hidden'] })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10)' })
	@Get('user/:userId')
	async getPostsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query() query: GetPostsQueryDto
	) {
		const data = await this.postsService.getPostsByUser(userId, query)
		return { success: true, data }
	}
}
