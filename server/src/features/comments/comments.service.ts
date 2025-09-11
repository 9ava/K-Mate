// src/features/comments/comments.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindManyOptions } from 'typeorm'
import { Comment } from './comment.entity'
import { Post } from '../posts/post.entity'
import { User } from '../users/user.entity'
import { CreateCommentDto, UpdateCommentDto, GetCommentsQueryDto, CommentResponseDto } from './comments.dto'

/**
 * CommentsService - 댓글 관리
 * 
 * 주요 기능:
 * - 댓글 CRUD
 * - community, trend 게시글에만 댓글 허용 (tips는 금지)
 * - DB 트리거로 정책 강제
 */
@Injectable()
export class CommentsService {
	constructor(
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(User) private readonly userRepo: Repository<User>
	) {}

	/**
	 * 댓글 생성
	 * - community, trend 게시글에만 댓글 허용
	 */
	async createComment(postId: number, userId: number, createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
		const post = await this.postRepo.findOne({ where: { id: postId } })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		// community, trend에만 댓글 허용
		if (post.postType !== 'community' && post.postType !== 'trend') {
			throw new ForbiddenException('community, trend 게시글에만 댓글을 작성할 수 있습니다.')
		}

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		const comment = this.commentRepo.create({
			post,
			user,
			content: createCommentDto.content
		})

		const savedComment = await this.commentRepo.save(comment)
		return this.formatCommentResponse(savedComment)
	}

	/**
	 * 게시글별 댓글 목록 조회
	 */
	async getCommentsByPost(postId: number, query: GetCommentsQueryDto): Promise<{ comments: CommentResponseDto[], total: number }> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		const post = await this.postRepo.findOne({ where: { id: postId } })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		const findOptions: FindManyOptions<Comment> = {
			where: { post: { id: postId } },
			relations: ['user'],
			order: { createdAt: 'ASC' },
			skip,
			take: limit
		}

		const [comments, total] = await this.commentRepo.findAndCount(findOptions)

		const formattedComments = comments.map(comment => this.formatCommentResponse(comment))

		return { comments: formattedComments, total }
	}

	/**
	 * 댓글 상세 조회
	 */
	async getCommentById(id: number): Promise<CommentResponseDto> {
		const comment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user', 'post']
		})

		if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.')

		return this.formatCommentResponse(comment)
	}

	/**
	 * 댓글 수정
	 * - 작성자만 수정 가능
	 */
	async updateComment(id: number, userId: number, updateCommentDto: UpdateCommentDto): Promise<CommentResponseDto> {
		const comment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user', 'post']
		})

		if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.')

		// 작성자만 수정 가능
		if (comment.user.id !== userId) {
			throw new ForbiddenException('작성자만 댓글을 수정할 수 있습니다.')
		}

		await this.commentRepo.update(id, { content: updateCommentDto.content })

		// 업데이트된 댓글 조회
		const updatedComment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user', 'post']
		})

		return this.formatCommentResponse(updatedComment!)
	}

	/**
	 * 댓글 삭제
	 * - 작성자만 삭제 가능
	 */
	async deleteComment(id: number, userId: number): Promise<void> {
		const comment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user']
		})

		if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.')

		// 작성자만 삭제 가능
		if (comment.user.id !== userId) {
			throw new ForbiddenException('작성자만 댓글을 삭제할 수 있습니다.')
		}

		await this.commentRepo.delete(id)
	}

	/**
	 * 사용자별 댓글 목록 조회
	 */
	async getCommentsByUser(userId: number, query: GetCommentsQueryDto): Promise<{ comments: CommentResponseDto[], total: number }> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		const findOptions: FindManyOptions<Comment> = {
			where: { user: { id: userId } },
			relations: ['user', 'post'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit
		}

		const [comments, total] = await this.commentRepo.findAndCount(findOptions)

		const formattedComments = comments.map(comment => this.formatCommentResponse(comment))

		return { comments: formattedComments, total }
	}

	/**
	 * 댓글 응답 포맷팅
	 */
	private formatCommentResponse(comment: Comment): CommentResponseDto {
		return {
			id: comment.id,
			postId: comment.post.id,
			user: {
				id: comment.user.id,
				name: comment.user.name,
				avatarUrl: comment.user.avatar_url
			},
			content: comment.content,
			createdAt: comment.createdAt
		}
	}
}
