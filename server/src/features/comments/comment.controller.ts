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
import { CommentService } from './comment.service'
import type { CreateCommentDto, UpdateCommentDto, GetCommentsOptions } from './comment.service'
import { Comment } from './comment.entity'

/**
 * Comment Controller - 댓글 API 엔드포인트 관리
 * 
 * 주요 기능:
 * - 댓글 CRUD API
 * - 게시글별 댓글 조회
 * - 사용자별 댓글 조회
 * - 페이지네이션
 * - 권한 기반 접근 제어
 */
@Controller('comments')
export class CommentController {
	constructor(private readonly commentService: CommentService) {}

	/**
	 * 새로운 댓글 생성
	 * POST /comments
	 * 인증 필요: JWT 쿠키 인증
	 */
	@Post()
	@UseGuards(AuthGuard('jwt-cookie'))
	async createComment(@Body() createCommentDto: CreateCommentDto, @Request() req: any): Promise<Comment> {
		const userId = req.user.sub
		return await this.commentService.createComment(createCommentDto, userId)
	}

	/**
	 * 댓글 목록 조회 (페이지네이션 지원)
	 * GET /comments?page=1&limit=20&post_id=1&user_id=1
	 */
	@Get()
	async getComments(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('post_id') post_id?: string,
		@Query('user_id') user_id?: string
	): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
		const options: GetCommentsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
			post_id: post_id ? parseInt(post_id, 10) : undefined,
			user_id: user_id ? parseInt(user_id, 10) : undefined,
		}

		const result = await this.commentService.getComments(options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 특정 댓글 조회
	 * GET /comments/:id
	 */
	@Get(':id')
	async getCommentById(@Param('id', ParseIntPipe) id: number): Promise<Comment> {
		return await this.commentService.getCommentById(id)
	}

	/**
	 * 댓글 수정
	 * PUT /comments/:id
	 * 인증 필요: JWT 쿠키 인증
	 * 권한: 작성자 또는 관리자
	 */
	@Put(':id')
	@UseGuards(AuthGuard('jwt-cookie'))
	async updateComment(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateCommentDto: UpdateCommentDto,
		@Request() req: any
	): Promise<Comment> {
		const userId = req.user.sub
		return await this.commentService.updateComment(id, updateCommentDto, userId)
	}

	/**
	 * 댓글 삭제
	 * DELETE /comments/:id
	 * 인증 필요: JWT 쿠키 인증
	 * 권한: 작성자 또는 관리자
	 */
	@Delete(':id')
	@UseGuards(AuthGuard('jwt-cookie'))
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteComment(@Param('id', ParseIntPipe) id: number, @Request() req: any): Promise<void> {
		const userId = req.user.sub
		await this.commentService.deleteComment(id, userId)
	}

	/**
	 * 특정 게시글의 댓글 목록 조회
	 * GET /comments/post/:postId
	 */
	@Get('post/:postId')
	async getCommentsByPost(
		@Param('postId', ParseIntPipe) postId: number,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
		const options: GetCommentsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
		}

		const result = await this.commentService.getCommentsByPost(postId, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 사용자의 댓글 목록 조회
	 * GET /comments/user/:userId
	 */
	@Get('user/:userId')
	async getCommentsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
		const options: GetCommentsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
		}

		const result = await this.commentService.getCommentsByUser(userId, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}
}