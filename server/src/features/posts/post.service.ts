import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Post, PostType, PostCategory, PostStatus } from './post.entity'
import { User } from '../users/user.entity'

/**
 * 게시글 생성 DTO
 */
export interface CreatePostDto {
	title: string
	content: string
	post_type: PostType
	category?: PostCategory
	status?: PostStatus
}

/**
 * 게시글 수정 DTO
 */
export interface UpdatePostDto {
	title?: string
	content?: string
	category?: PostCategory
	status?: PostStatus
}

/**
 * 게시글 조회 옵션
 */
export interface GetPostsOptions {
	page?: number
	limit?: number
	post_type?: PostType
	category?: PostCategory
	status?: PostStatus
	author_id?: number
	search?: string
}

/**
 * Post Service - 게시글 비즈니스 로직 관리
 * 
 * 주요 기능:
 * - 게시글 CRUD 작업
 * - 게시글 타입별 관리 (community, tips)
 * - 권한 기반 접근 제어
 * - 검색 및 필터링
 * - 페이지네이션
 * - 조회수 관리
 */
@Injectable()
export class PostService {
	constructor(
		@InjectRepository(Post) private readonly postRepository: Repository<Post>,
		@InjectRepository(User) private readonly userRepository: Repository<User>
	) {}

	/**
	 * 새로운 게시글 생성
	 * @param createPostDto 게시글 생성 데이터
	 * @param userId 작성자 ID
	 * @returns 생성된 게시글
	 */
	async createPost(createPostDto: CreatePostDto, userId: number): Promise<Post> {
		// 사용자 존재 확인
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 게시글 엔티티 생성
		const post = this.postRepository.create({
			...createPostDto,
			author_id: userId,
			status: createPostDto.status || 'published',
		})

		// 데이터베이스에 저장
		return await this.postRepository.save(post)
	}

	/**
	 * 게시글 목록 조회 (페이지네이션 지원)
	 * @param options 조회 옵션
	 * @returns 게시글 목록과 총 개수
	 */
	async getPosts(options: GetPostsOptions = {}): Promise<{ posts: Post[]; total: number }> {
		const {
			page = 1,
			limit = 10,
			post_type,
			category,
			status = 'published',
			author_id,
			search,
		} = options

		// 쿼리 빌더 생성
		const queryBuilder = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.author', 'author')
			.where('post.status = :status', { status })

		// 게시글 타입 필터
		if (post_type) {
			queryBuilder.andWhere('post.post_type = :post_type', { post_type })
		}

		// 카테고리 필터
		if (category) {
			queryBuilder.andWhere('post.category = :category', { category })
		}

		// 작성자 필터
		if (author_id) {
			queryBuilder.andWhere('post.author_id = :author_id', { author_id })
		}

		// 검색 필터 (제목 또는 내용에서 검색)
		if (search) {
			queryBuilder.andWhere(
				'(post.title LIKE :search OR post.content LIKE :search)',
				{ search: `%${search}%` }
			)
		}

		// 정렬 (최신순)
		queryBuilder.orderBy('post.created_at', 'DESC')

		// 페이지네이션
		const skip = (page - 1) * limit
		queryBuilder.skip(skip).take(limit)

		// 실행
		const [posts, total] = await queryBuilder.getManyAndCount()

		return { posts, total }
	}

	/**
	 * ID로 게시글 조회
	 * @param id 게시글 ID
	 * @returns 게시글 정보
	 */
	async getPostById(id: number): Promise<Post> {
		const post = await this.postRepository.findOne({
			where: { id, status: 'published' },
			relations: ['author'],
		})

		if (!post) {
			throw new NotFoundException('게시글을 찾을 수 없습니다.')
		}

		// 조회수 증가
		await this.incrementViewCount(id)

		return post
	}

	/**
	 * 게시글 수정
	 * @param id 게시글 ID
	 * @param updatePostDto 수정 데이터
	 * @param userId 요청자 ID
	 * @returns 수정된 게시글
	 */
	async updatePost(id: number, updatePostDto: UpdatePostDto, userId: number): Promise<Post> {
		const post = await this.postRepository.findOne({
			where: { id },
		})

		if (!post) {
			throw new NotFoundException('게시글을 찾을 수 없습니다.')
		}

		// 권한 확인: 작성자이거나 관리자만 수정 가능
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (post.author_id !== userId && user?.role !== 'admin') {
			throw new ForbiddenException('수정 권한이 없습니다.')
		}

		// 업데이트
		Object.assign(post, updatePostDto)
		return await this.postRepository.save(post)
	}

	/**
	 * 게시글 삭제 (소프트 삭제)
	 * @param id 게시글 ID
	 * @param userId 요청자 ID
	 */
	async deletePost(id: number, userId: number): Promise<void> {
		const post = await this.postRepository.findOne({
			where: { id },
		})

		if (!post) {
			throw new NotFoundException('게시글을 찾을 수 없습니다.')
		}

		// 권한 확인: 작성자이거나 관리자만 삭제 가능
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (post.author_id !== userId && user?.role !== 'admin') {
			throw new ForbiddenException('삭제 권한이 없습니다.')
		}

		// 소프트 삭제
		post.status = 'hidden'
		await this.postRepository.save(post)
	}

	/**
	 * 게시글 조회수 증가
	 * @param id 게시글 ID
	 */
	async incrementViewCount(id: number): Promise<void> {
		await this.postRepository.increment({ id }, 'view_count', 1)
	}

	/**
	 * 커뮤니티 게시글 목록 조회
	 * @param options 조회 옵션
	 * @returns 커뮤니티 게시글 목록
	 */
	async getCommunityPosts(options: GetPostsOptions = {}): Promise<{ posts: Post[]; total: number }> {
		return this.getPosts({ ...options, post_type: 'community' })
	}

	/**
	 * 팁 게시글 목록 조회
	 * @param options 조회 옵션
	 * @returns 팁 게시글 목록
	 */
	async getTipsPosts(options: GetPostsOptions = {}): Promise<{ posts: Post[]; total: number }> {
		return this.getPosts({ ...options, post_type: 'tips' })
	}

	/**
	 * 사용자의 게시글 목록 조회
	 * @param userId 사용자 ID
	 * @param options 조회 옵션
	 * @returns 사용자의 게시글 목록
	 */
	async getPostsByUser(userId: number, options: GetPostsOptions = {}): Promise<{ posts: Post[]; total: number }> {
		return this.getPosts({ ...options, author_id: userId })
	}

	/**
	 * 카테고리별 게시글 목록 조회
	 * @param category 카테고리
	 * @param options 조회 옵션
	 * @returns 카테고리별 게시글 목록
	 */
	async getPostsByCategory(category: PostCategory, options: GetPostsOptions = {}): Promise<{ posts: Post[]; total: number }> {
		return this.getPosts({ ...options, category })
	}
}
