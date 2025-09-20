import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindManyOptions } from 'typeorm'
import { Comment } from './comment.entity'
import { Post } from '../posts/post.entity'
import { User } from '../users/user.entity'
import {
	CreateCommentDto,
	UpdateCommentDto,
	GetCommentsQueryDto,
	CommentResponseDto,
} from './comments.dto'

@Injectable()
export class CommentsService {
	constructor(
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(User) private readonly userRepo: Repository<User>
	) {}

	// 댓글 생성 (community, trend만 허용)
	async createComment(
		postId: number,
		userId: number,
		dto: CreateCommentDto
	): Promise<CommentResponseDto> {
		const post = await this.postRepo.findOne({ where: { id: postId } })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')
		if (post.postType !== 'community' && post.postType !== 'trend') {
			throw new ForbiddenException('community, trend 게시글에만 댓글을 작성할 수 있습니다.')
		}

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		const entity = this.commentRepo.create({ post, user, content: dto.content })
		const saved = await this.commentRepo.save(entity)

		// relations를 다시 로드해 응답 포맷에 필요한 필드 보장
		const withRelations = await this.commentRepo.findOne({
			where: { id: saved.id },
			relations: ['user', 'post'],
		})
		return this.formatCommentResponse(withRelations!)
	}

	// 게시글별 댓글 목록
	async getCommentsByPost(
		postId: number,
		query: GetCommentsQueryDto
	): Promise<{ comments: CommentResponseDto[]; total: number }> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		const post = await this.postRepo.findOne({ where: { id: postId } })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		const findOptions: FindManyOptions<Comment> = {
			where: { post: { id: postId } },
			relations: ['user', 'post'],
			order: { createdAt: 'ASC' },
			skip,
			take: limit,
		}

		const [rows, total] = await this.commentRepo.findAndCount(findOptions)
		return {
			comments: rows.map((c) => this.formatCommentResponse(c)),
			total,
		}
	}

	// ✅ 사용자별 댓글 목록 (컨트롤러에서 사용 중)
	async getCommentsByUser(
		userId: number,
		query: GetCommentsQueryDto
	): Promise<{ comments: CommentResponseDto[]; total: number }> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		const findOptions: FindManyOptions<Comment> = {
			where: { user: { id: userId } },
			relations: ['user', 'post'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		}

		const [rows, total] = await this.commentRepo.findAndCount(findOptions)
		return {
			comments: rows.map((c) => this.formatCommentResponse(c)),
			total,
		}
	}

	// 댓글 상세
	async getCommentById(id: number): Promise<CommentResponseDto> {
		const comment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user', 'post'],
		})
		if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.')
		return this.formatCommentResponse(comment)
	}

	// 댓글 수정 (작성자 or admin)
	async updateComment(
		id: number,
		userId: number,
		dto: UpdateCommentDto
	): Promise<CommentResponseDto> {
		const comment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user', 'post'],
		})
		if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.')

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')
		if (comment.user.id !== userId && user.role !== 'admin') {
			throw new ForbiddenException('작성자 또는 관리자만 댓글을 수정할 수 있습니다.')
		}

		await this.commentRepo.update(id, { content: dto.content })

		const updated = await this.commentRepo.findOne({
			where: { id },
			relations: ['user', 'post'],
		})
		return this.formatCommentResponse(updated!)
	}

	// 댓글 삭제 (작성자 or admin)
	async deleteComment(id: number, userId: number): Promise<void> {
		const comment = await this.commentRepo.findOne({
			where: { id },
			relations: ['user'],
		})
		if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.')

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')
		if (comment.user.id !== userId && user.role !== 'admin') {
			throw new ForbiddenException('작성자 또는 관리자만 댓글을 삭제할 수 있습니다.')
		}

		await this.commentRepo.delete(id)
	}

	// 공통 응답 포맷터 (UTC ISO로 내려서 프론트에서 로컬 변환)
	private formatCommentResponse(comment: Comment): CommentResponseDto {
		return {
			id: comment.id,
			postId: comment.post.id,
			user: {
				id: comment.user.id,
				name: comment.user.name,
				avatarUrl: (comment.user as any).avatar_url ?? (comment.user as any).avatarUrl ?? null,
			},
			content: comment.content,
			createdAt: comment.createdAt,
		}
	}
}
