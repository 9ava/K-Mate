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
import { PostService } from './post.service'
import type { CreatePostDto, UpdatePostDto, GetPostsOptions } from './post.service'
import { Post as PostEntity, PostType, PostCategory } from './post.entity'

/**
 * Post Controller - 게시글 API 엔드포인트 관리
 * 
 * 주요 기능:
 * - 게시글 CRUD API
 * - 게시글 타입별 조회 (community, tips)
 * - 카테고리별 필터링
 * - 검색 기능
 * - 페이지네이션
 * - 권한 기반 접근 제어
 */
@Controller('posts')
export class PostController {
	constructor(private readonly postService: PostService) {}

	/**
	 * 새로운 게시글 생성
	 * POST /posts
	 * 인증 필요: JWT 쿠키 인증
	 */
	@Post()
	@UseGuards(AuthGuard('jwt-cookie'))
	async createPost(@Body() createPostDto: CreatePostDto, @Request() req: any): Promise<PostEntity> {
		const userId = req.user.sub
		return await this.postService.createPost(createPostDto, userId)
	}

	/**
	 * 게시글 목록 조회 (페이지네이션 지원)
	 * GET /posts?page=1&limit=10&post_type=community&category=travel_tip&search=서울
	 */
	@Get()
	async getPosts(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('post_type') post_type?: string,
		@Query('category') category?: string,
		@Query('status') status?: string,
		@Query('author_id') author_id?: string,
		@Query('search') search?: string
	): Promise<{ posts: PostEntity[]; total: number; page: number; limit: number }> {
		const options: GetPostsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			post_type: post_type as PostType,
			category: category as PostCategory,
			status: status as any,
			author_id: author_id ? parseInt(author_id, 10) : undefined,
			search,
		}

		const result = await this.postService.getPosts(options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 특정 게시글 조회
	 * GET /posts/:id
	 */
	@Get(':id')
	async getPostById(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
		return await this.postService.getPostById(id)
	}

	/**
	 * 게시글 수정
	 * PUT /posts/:id
	 * 인증 필요: JWT 쿠키 인증
	 * 권한: 작성자 또는 관리자
	 */
	@Put(':id')
	@UseGuards(AuthGuard('jwt-cookie'))
	async updatePost(
		@Param('id', ParseIntPipe) id: number,
		@Body() updatePostDto: UpdatePostDto,
		@Request() req: any
	): Promise<PostEntity> {
		const userId = req.user.sub
		return await this.postService.updatePost(id, updatePostDto, userId)
	}

	/**
	 * 게시글 삭제
	 * DELETE /posts/:id
	 * 인증 필요: JWT 쿠키 인증
	 * 권한: 작성자 또는 관리자
	 */
	@Delete(':id')
	@UseGuards(AuthGuard('jwt-cookie'))
	@HttpCode(HttpStatus.NO_CONTENT)
	async deletePost(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<void> {
		const userId = req.user.sub
		await this.postService.deletePost(id, userId)
	}

	/**
	 * 커뮤니티 게시글 목록 조회
	 * GET /posts/community
	 */
	@Get('community')
	async getCommunityPosts(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('category') category?: string,
		@Query('search') search?: string
	): Promise<{ posts: PostEntity[]; total: number; page: number; limit: number }> {
		const options: GetPostsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			category: category as PostCategory,
			search,
		}

		const result = await this.postService.getCommunityPosts(options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 팁 게시글 목록 조회
	 * GET /posts/tips
	 */
	@Get('tips')
	async getTipsPosts(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string
	): Promise<{ posts: PostEntity[]; total: number; page: number; limit: number }> {
		const options: GetPostsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			search,
		}

		const result = await this.postService.getTipsPosts(options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 사용자의 게시글 목록 조회
	 * GET /posts/user/:userId
	 */
	@Get('user/:userId')
	async getPostsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('post_type') post_type?: string
	): Promise<{ posts: PostEntity[]; total: number; page: number; limit: number }> {
		const options: GetPostsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			post_type: post_type as PostType,
		}

		const result = await this.postService.getPostsByUser(userId, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 카테고리별 게시글 목록 조회
	 * GET /posts/category/:category
	 */
	@Get('category/:category')
	async getPostsByCategory(
		@Param('category') category: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('post_type') post_type?: string
	): Promise<{ posts: PostEntity[]; total: number; page: number; limit: number }> {
		const options: GetPostsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			post_type: post_type as PostType,
		}

		const result = await this.postService.getPostsByCategory(category as PostCategory, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}
}
