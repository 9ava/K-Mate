import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Comment } from './comment.entity'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'

/**
 * 댓글 생성 DTO
 */
export interface CreateCommentDto {
	post_id: number
	content: string
}

/**
 * 댓글 수정 DTO
 */
export interface UpdateCommentDto {
	content?: string
}

/**
 * 댓글 조회 옵션
 */
export interface GetCommentsOptions {
	page?: number
	limit?: number
	post_id?: number
	user_id?: number
}

/**
 * Comment Service - 댓글 비즈니스 로직 관리
 * 
 * 주요 기능:
 * - 댓글 CRUD 작업
 * - 게시글과 댓글 간의 관계 관리
 * - 권한 기반 접근 제어
 * - 페이지네이션
 * - 자동 삭제 (게시글 삭제 시 관련 댓글 자동 삭제)
 */
@Injectable()
export class CommentService {
	constructor(
		@InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(Post) private readonly postRepository: Repository<Post>
	) {}

	/**
	 * 새로운 댓글 생성
	 * @param createCommentDto 댓글 생성 데이터
	 * @param userId 작성자 ID
	 * @returns 생성된 댓글
	 */
	async createComment(createCommentDto: CreateCommentDto, userId: number): Promise<Comment> {
		// 사용자 존재 확인
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 게시글 존재 확인
		const post = await this.postRepository.findOne({ 
			where: { id: createCommentDto.post_id, status: 'published' } 
		})
		if (!post) {
			throw new NotFoundException('게시글을 찾을 수 없습니다.')
		}

		// 댓글 엔티티 생성
		const comment = this.commentRepository.create({
			...createCommentDto,
			user_id: userId,
		})

		// 데이터베이스에 저장
		const savedComment = await this.commentRepository.save(comment)

		// 사용자 정보와 함께 반환
		return await this.commentRepository.findOne({
			where: { id: savedComment.id },
			relations: ['user', 'post'],
		}) as Comment
	}

	/**
	 * 댓글 목록 조회 (페이지네이션 지원)
	 * @param options 조회 옵션
	 * @returns 댓글 목록과 총 개수
	 */
	async getComments(options: GetCommentsOptions = {}): Promise<{ comments: Comment[]; total: number }> {
		const {
			page = 1,
			limit = 20,
			post_id,
			user_id,
		} = options

		// 쿼리 빌더 생성
		const queryBuilder = this.commentRepository
			.createQueryBuilder('comment')
			.leftJoinAndSelect('comment.user', 'user')
			.leftJoinAndSelect('comment.post', 'post')

		// 게시글 필터
		if (post_id) {
			queryBuilder.andWhere('comment.post_id = :post_id', { post_id })
		}

		// 사용자 필터
		if (user_id) {
			queryBuilder.andWhere('comment.user_id = :user_id', { user_id })
		}

		// 정렬 (최신순)
		queryBuilder.orderBy('comment.created_at', 'ASC')

		// 페이지네이션
		const skip = (page - 1) * limit
		queryBuilder.skip(skip).take(limit)

		// 실행
		const [comments, total] = await queryBuilder.getManyAndCount()

		return { comments, total }
	}

	/**
	 * ID로 댓글 조회
	 * @param id 댓글 ID
	 * @returns 댓글 정보
	 */
	async getCommentById(id: number): Promise<Comment> {
		const comment = await this.commentRepository.findOne({
			where: { id },
			relations: ['user', 'post'],
		})

		if (!comment) {
			throw new NotFoundException('댓글을 찾을 수 없습니다.')
		}

		return comment
	}

	/**
	 * 댓글 수정
	 * @param id 댓글 ID
	 * @param updateCommentDto 수정 데이터
	 * @param userId 요청자 ID
	 * @returns 수정된 댓글
	 */
	async updateComment(id: number, updateCommentDto: UpdateCommentDto, userId: number): Promise<Comment> {
		const comment = await this.commentRepository.findOne({
			where: { id },
		})

		if (!comment) {
			throw new NotFoundException('댓글을 찾을 수 없습니다.')
		}

		// 권한 확인: 작성자이거나 관리자만 수정 가능
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (comment.user_id !== userId && user?.role !== 'admin') {
			throw new ForbiddenException('수정 권한이 없습니다.')
		}

		// 업데이트
		Object.assign(comment, updateCommentDto)
		const updatedComment = await this.commentRepository.save(comment)

		// 사용자 정보와 함께 반환
		return await this.commentRepository.findOne({
			where: { id: updatedComment.id },
			relations: ['user', 'post'],
		}) as Comment
	}

	/**
	 * 댓글 삭제
	 * @param id 댓글 ID
	 * @param userId 요청자 ID
	 */
	async deleteComment(id: number, userId: number): Promise<void> {
		const comment = await this.commentRepository.findOne({
			where: { id },
		})

		if (!comment) {
			throw new NotFoundException('댓글을 찾을 수 없습니다.')
		}

		// 권한 확인: 작성자이거나 관리자만 삭제 가능
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (comment.user_id !== userId && user?.role !== 'admin') {
			throw new ForbiddenException('삭제 권한이 없습니다.')
		}

		// 댓글 삭제
		await this.commentRepository.remove(comment)
	}

	/**
	 * 특정 게시글의 댓글 목록 조회
	 * @param postId 게시글 ID
	 * @param options 조회 옵션
	 * @returns 댓글 목록
	 */
	async getCommentsByPost(postId: number, options: GetCommentsOptions = {}): Promise<{ comments: Comment[]; total: number }> {
		return this.getComments({ ...options, post_id: postId })
	}

	/**
	 * 사용자의 댓글 목록 조회
	 * @param userId 사용자 ID
	 * @param options 조회 옵션
	 * @returns 댓글 목록
	 */
	async getCommentsByUser(userId: number, options: GetCommentsOptions = {}): Promise<{ comments: Comment[]; total: number }> {
		return this.getComments({ ...options, user_id: userId })
	}
}