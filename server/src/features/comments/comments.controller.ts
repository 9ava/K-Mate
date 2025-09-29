// src/features/comments/comments.controller.ts
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
import { CommentsService } from './comments.service'
import {
	CreateCommentDto,
	UpdateCommentDto,
	GetCommentsQueryDto,
	CommentResponseDto,
	CourseCommentResponseDto,
} from './comments.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 댓글 생성
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '댓글 생성 (community, trend 게시글에만 허용)' })
	@ApiOkResponse({
		description: '댓글 생성 성공',
		type: CommentResponseDto,
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: 'community, trend 게시글에만 댓글 허용' })
	@ApiParam({ name: 'postId', type: Number, description: '게시글 ID' })
	@ApiCookieAuth('access_token')
	@Post('post/:postId')
	@UseGuards(JwtAuthGuard)
	async createComment(
		@Param('postId', ParseIntPipe) postId: number,
		@Req() req: Request,
		@Body() createCommentDto: CreateCommentDto
	) {
		const userId = (req.user as any).id
		const data = await this.commentsService.createComment(postId, userId, createCommentDto)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글별 댓글 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글별 댓글 목록 조회' })
	@ApiOkResponse({
		description: '댓글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					comments: [
						{
							id: 1,
							postId: 1,
							user: { id: 1, name: '홍길동', avatarUrl: null },
							content: '정말 유용한 정보네요!',
							createdAt: '2024-01-01T00:00:00.000Z',
						},
					],
					total: 1,
				},
			},
		},
	})
	@ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
	@ApiParam({ name: 'postId', type: Number, description: '게시글 ID' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: '페이지당 항목 수 (기본: 10)',
	})
	@Get('post/:postId')
	async getCommentsByPost(
		@Param('postId', ParseIntPipe) postId: number,
		@Query() query: GetCommentsQueryDto
	) {
		const data = await this.commentsService.getCommentsByPost(postId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 댓글 상세 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '댓글 상세 조회' })
	@ApiOkResponse({
		description: '댓글 상세 조회 성공',
		type: CommentResponseDto,
	})
	@ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
	@ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
	@Get(':id')
	async getCommentById(@Param('id', ParseIntPipe) id: number) {
		const data = await this.commentsService.getCommentById(id)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 댓글 수정
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '댓글 수정 (작성자만)' })
	@ApiOkResponse({
		description: '댓글 수정 성공',
		type: CommentResponseDto,
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '작성자만 수정 가능' })
	@ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
	@ApiCookieAuth('access_token')
	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async updateComment(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: Request,
		@Body() updateCommentDto: UpdateCommentDto
	) {
		const userId = (req.user as any).id
		const data = await this.commentsService.updateComment(id, userId, updateCommentDto)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 댓글 삭제
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '댓글 삭제 (작성자만)' })
	@ApiOkResponse({
		description: '댓글 삭제 성공',
		schema: {
			example: {
				success: true,
				message: '댓글이 삭제되었습니다.',
			},
		},
	})
	@ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '작성자만 삭제 가능' })
	@ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
	@ApiCookieAuth('access_token')
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
		const userId = (req.user as any).id
		await this.commentsService.deleteComment(id, userId)
		return { success: true, message: '댓글이 삭제되었습니다.' }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 사용자별 댓글 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사용자별 댓글 목록 조회' })
	@ApiOkResponse({
		description: '사용자별 댓글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					comments: [],
					total: 0,
				},
			},
		},
	})
	@ApiParam({ name: 'userId', type: Number, description: '사용자 ID' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: '페이지당 항목 수 (기본: 10)',
	})
	@Get('user/:userId')
	async getCommentsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query() query: GetCommentsQueryDto
	) {
		const data = await this.commentsService.getCommentsByUser(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Course Comment Endpoints
	// ────────────────────────────────────────────────────────────────────────────

	// 코스 댓글 생성
	@ApiOperation({ summary: '코스 댓글 생성' })
	@ApiOkResponse({
		description: '코스 댓글 생성 성공',
		type: CourseCommentResponseDto,
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '코스를 찾을 수 없음' })
	@ApiParam({ name: 'courseId', type: String, description: '코스 ID' })
	@ApiCookieAuth('access_token')
	@Post('course/:courseId')
	@UseGuards(JwtAuthGuard)
	async createCourseComment(
		@Param('courseId') courseId: string,
		@Req() req: Request,
		@Body() createCommentDto: CreateCommentDto
	) {
		const userId = (req.user as any).id
		const data = await this.commentsService.createCourseComment(courseId, userId, createCommentDto)
		return { success: true, data }
	}

	// 코스별 댓글 목록 조회
	@ApiOperation({ summary: '코스별 댓글 목록 조회' })
	@ApiOkResponse({
		description: '코스 댓글 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					comments: [
						{
							id: 1,
							courseId: '123',
							user: { id: 1, name: '홍길동', avatarUrl: null },
							content: '정말 좋은 코스네요!',
							createdAt: '2024-01-01T00:00:00.000Z',
						},
					],
					total: 1,
				},
			},
		},
	})
	@ApiNotFoundResponse({ description: '코스를 찾을 수 없음' })
	@ApiParam({ name: 'courseId', type: String, description: '코스 ID' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: '페이지당 항목 수 (기본: 10)',
	})
	@Get('course/:courseId')
	async getCommentsByCourse(
		@Param('courseId') courseId: string,
		@Query() query: GetCommentsQueryDto
	) {
		const data = await this.commentsService.getCommentsByCourse(courseId, query)
		return { success: true, data }
	}

	// 코스 댓글 수정
	@ApiOperation({ summary: '코스 댓글 수정 (작성자만)' })
	@ApiOkResponse({
		description: '코스 댓글 수정 성공',
		type: CourseCommentResponseDto,
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '작성자만 수정 가능' })
	@ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
	@ApiCookieAuth('access_token')
	@Put('course-comment/:id')
	@UseGuards(JwtAuthGuard)
	async updateCourseComment(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: Request,
		@Body() updateCommentDto: UpdateCommentDto
	) {
		const userId = (req.user as any).id
		const data = await this.commentsService.updateCourseComment(id, userId, updateCommentDto)
		return { success: true, data }
	}

	// 코스 댓글 삭제
	@ApiOperation({ summary: '코스 댓글 삭제 (작성자만)' })
	@ApiOkResponse({
		description: '코스 댓글 삭제 성공',
		schema: {
			example: {
				success: true,
				message: '댓글이 삭제되었습니다.',
			},
		},
	})
	@ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '작성자만 삭제 가능' })
	@ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
	@ApiCookieAuth('access_token')
	@Delete('course-comment/:id')
	@UseGuards(JwtAuthGuard)
	async deleteCourseComment(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
		const userId = (req.user as any).id
		await this.commentsService.deleteCourseComment(id, userId)
		return { success: true, message: '댓글이 삭제되었습니다.' }
	}
}
