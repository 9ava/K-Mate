# K-Mate 서버 새로 구현된 기능 상세 설명

## 📋 목차
1. [Posts 시스템 (게시글 관리)](#1-posts-시스템-게시글-관리)
2. [Comments 시스템 (댓글 관리)](#2-comments-시스템-댓글-관리)
3. [Interactions 시스템 (상호작용 관리)](#3-interactions-시스템-상호작용-관리)
4. [모듈 통합](#4-모듈-통합)

---

## 1. Posts 시스템 (게시글 관리)

### 1.1 Post 엔티티 (Entity)

**파일**: `src/features/posts/post.entity.ts`

```typescript
// src/features/posts/post.entity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	OneToMany,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { User } from '../users/user.entity'
import { Comment } from '../comments/comment.entity'

/**
 * 게시글 타입 정의
 * - community: 커뮤니티 게시글 (댓글✅ 좋아요✅ 스크랩✅)
 * - tips: 팁 게시글 (댓글❌ 좋아요❌ 스크랩❌, 관리자만 CRUD)
 * - trend: 트렌드 게시글 (댓글✅ 좋아요✅ 스크랩✅, 관리자만 CRUD)
 */
export type PostType = 'community' | 'tips' | 'trend'

/**
 * 게시글 카테고리 정의
 */
export type PostCategory = 'travel_tip' | 'food_review' | 'cafe_review' | 'general'

/**
 * 게시글 상태 정의
 */
export type PostStatus = 'published' | 'draft' | 'hidden'

/**
 * Post 엔티티 - K-Buzz 게시글 관리
 * 
 * 주요 특징:
 * - 단일 테이블로 post_type에 따라 기능 분기
 * - community: 모든 사용자 CRUD, 댓글/좋아요/스크랩 허용
 * - tips: 관리자만 CRUD, 댓글/좋아요/스크랩 금지
 * - trend: 관리자만 CRUD, 댓글/좋아요/스크랩 허용
 */
@Entity({ name: 'posts' })
export class Post {
	@ApiProperty({ description: '게시글 ID (BIGINT UNSIGNED, AUTO_INCREMENT)' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: '작성자 ID (users.id 참조)' })
	@Index()
	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'author_id' })
	author!: User

	@ApiProperty({ description: '게시글 제목' })
	@Column({ type: 'varchar', length: 200, nullable: false })
	title!: string

	@ApiProperty({ description: '게시글 내용' })
	@Column({ type: 'longtext', nullable: false })
	content!: string

	@ApiProperty({ 
		description: '게시글 타입',
		enum: ['community', 'tips', 'trend'],
		example: 'community'
	})
	@Index()
	@Column({ 
		type: 'enum', 
		enum: ['community', 'tips', 'trend'], 
		nullable: false 
	})
	postType!: PostType

	@ApiProperty({ 
		description: '게시글 카테고리',
		enum: ['travel_tip', 'food_review', 'cafe_review', 'general'],
		required: false
	})
	@Index()
	@Column({ 
		type: 'enum', 
		enum: ['travel_tip', 'food_review', 'cafe_review', 'general'], 
		nullable: true 
	})
	category!: PostCategory | null

	@ApiProperty({ 
		description: '게시글 상태',
		enum: ['published', 'draft', 'hidden'],
		default: 'published'
	})
	@Index()
	@Column({ 
		type: 'enum', 
		enum: ['published', 'draft', 'hidden'], 
		nullable: false, 
		default: 'published' 
	})
	status!: PostStatus

	@ApiProperty({ description: '조회수', default: 0 })
	@Column({ type: 'int', nullable: false, default: 0 })
	viewCount!: number

	@ApiProperty({ description: '생성일시' })
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	createdAt!: Date

	@ApiProperty({ description: '수정일시' })
	@UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
	updatedAt!: Date

	// 관계 설정
	@OneToMany(() => Comment, comment => comment.post, { cascade: true })
	comments!: Comment[]
}
```

**주요 특징 설명:**
- **PostType ENUM**: `community`, `tips`, `trend` 3가지 타입으로 기능 분기
- **카테고리 분류**: 여행팁, 맛집리뷰, 카페리뷰, 일반 카테고리
- **상태 관리**: 발행, 임시저장, 숨김 상태
- **관계 설정**: User와 ManyToOne, Comment와 OneToMany 관계
- **인덱스 최적화**: 자주 조회되는 필드에 인덱스 설정

### 1.2 PostsService (비즈니스 로직)

**파일**: `src/features/posts/posts.service.ts`

```typescript
// src/features/posts/posts.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, FindManyOptions } from 'typeorm'
import { Post, PostType } from './post.entity'
import { User, UserRole } from '../users/user.entity'
import { Comment } from '../comments/comment.entity'
import { Interaction } from '../interactions/interaction.entity'
import { CreatePostDto, UpdatePostDto, GetPostsQueryDto, PostResponseDto } from './posts.dto'

/**
 * PostsService - K-Buzz 게시글 관리
 * 
 * 주요 기능:
 * - 게시글 CRUD (정책에 따른 권한 제어)
 * - community: 모든 사용자 CRUD
 * - tips/trend: 관리자만 CRUD
 * - 상호작용 통계 포함 조회
 */
@Injectable()
export class PostsService {
	constructor(
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>
	) {}

	/**
	 * 게시글 생성
	 * - tips/trend는 관리자만 생성 가능
	 */
	async createPost(userId: number, createPostDto: CreatePostDto): Promise<PostResponseDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// tips/trend는 관리자만 생성 가능
		if (createPostDto.postType === 'tips' || createPostDto.postType === 'trend') {
			if (user.role !== 'admin') {
				throw new ForbiddenException('관리자만 tips/trend 게시글을 생성할 수 있습니다.')
			}
		}

		const post = this.postRepo.create({
			author: user,
			title: createPostDto.title,
			content: createPostDto.content,
			postType: createPostDto.postType,
			category: createPostDto.category || null,
			status: createPostDto.status || 'published'
		})

		const savedPost = await this.postRepo.save(post)
		return this.formatPostResponse(savedPost)
	}

	/**
	 * 게시글 목록 조회 (페이지네이션, 필터링, 검색)
	 */
	async getPosts(query: GetPostsQueryDto): Promise<{ posts: PostResponseDto[], total: number }> {
		const { page = 1, limit = 10, postType, category, status, search } = query
		const skip = (page - 1) * limit

		const where: any = {}
		if (postType) where.postType = postType
		if (category) where.category = category
		if (status) where.status = status

		const findOptions: FindManyOptions<Post> = {
			where,
			relations: ['author'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit
		}

		// 검색 기능
		if (search) {
			findOptions.where = [
				{ ...where, title: Like(`%${search}%`) },
				{ ...where, content: Like(`%${search}%`) }
			]
		}

		const [posts, total] = await this.postRepo.findAndCount(findOptions)
		
		const formattedPosts = await Promise.all(
			posts.map(post => this.formatPostResponse(post))
		)

		return { posts: formattedPosts, total }
	}

	/**
	 * 게시글 상세 조회 (조회수 증가)
	 */
	async getPostById(id: number): Promise<PostResponseDto> {
		const post = await this.postRepo.findOne({
			where: { id },
			relations: ['author']
		})

		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		// 조회수 증가
		await this.postRepo.update(id, { viewCount: post.viewCount + 1 })
		post.viewCount += 1

		return this.formatPostResponse(post)
	}

	/**
	 * 게시글 응답 포맷팅 (상호작용 통계 포함)
	 */
	private async formatPostResponse(post: Post): Promise<PostResponseDto> {
		// 상호작용 통계 조회
		const [likeCount, scrapCount, commentCount] = await Promise.all([
			this.interactionRepo.count({
				where: { targetType: 'post', targetId: post.id, interactionType: 'like' }
			}),
			this.interactionRepo.count({
				where: { targetType: 'post', targetId: post.id, interactionType: 'scrap' }
			}),
			this.commentRepo.count({
				where: { post: { id: post.id } }
			})
		])

		return {
			id: post.id,
			author: {
				id: post.author.id,
				name: post.author.name,
				avatarUrl: post.author.avatar_url,
				role: post.author.role
			},
			title: post.title,
			content: post.content,
			postType: post.postType,
			category: post.category,
			status: post.status,
			viewCount: post.viewCount,
			likeCount,
			scrapCount,
			commentCount,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt
		}
	}
}
```

**주요 기능 설명:**
- **권한 검증**: tips/trend는 관리자만 생성 가능
- **페이지네이션**: `skip`, `take`를 사용한 효율적인 페이징
- **검색 기능**: 제목과 내용에서 LIKE 검색
- **조회수 증가**: 상세 조회 시 자동으로 조회수 증가
- **통계 포함**: 좋아요, 스크랩, 댓글 수를 포함한 응답

### 1.3 PostsController (API 엔드포인트)

**파일**: `src/features/posts/posts.controller.ts`

```typescript
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
}
```

**주요 특징:**
- **기존 패턴 준수**: `{ success: true, data }` 응답 형식
- **Swagger 문서화**: 완전한 API 문서화
- **인증 가드**: JWT 쿠키 기반 인증
- **쿼리 파라미터**: 페이지네이션, 필터링, 검색 지원

---

## 2. Comments 시스템 (댓글 관리)

### 2.1 Comment 엔티티

**파일**: `src/features/comments/comment.entity.ts`

```typescript
// src/features/comments/comment.entity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	Index,
	CreateDateColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'

/**
 * Comment 엔티티 - 댓글 관리
 * 
 * 주요 특징:
 * - community, trend 게시글에만 댓글 허용 (tips는 금지)
 * - DB 트리거로 정책 강제
 * - CASCADE 삭제로 게시글 삭제 시 댓글도 함께 삭제
 */
@Entity({ name: 'comments' })
export class Comment {
	@ApiProperty({ description: '댓글 ID (BIGINT UNSIGNED, AUTO_INCREMENT)' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: '게시글 ID (posts.id 참조)' })
	@Index()
	@ManyToOne(() => Post, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'post_id' })
	post!: Post

	@ApiProperty({ description: '작성자 ID (users.id 참조)' })
	@Index()
	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'user_id' })
	user!: User

	@ApiProperty({ description: '댓글 내용' })
	@Column({ type: 'text', nullable: false })
	content!: string

	@ApiProperty({ description: '생성일시' })
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	createdAt!: Date
}
```

### 2.2 CommentsService

**파일**: `src/features/comments/comments.service.ts`

```typescript
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
```

---

## 3. Interactions 시스템 (상호작용 관리)

### 3.1 Interaction 엔티티

**파일**: `src/features/interactions/interaction.entity.ts`

```typescript
// src/features/interactions/interaction.entity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	Index,
	CreateDateColumn,
	Unique,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { User } from '../users/user.entity'

/**
 * 상호작용 타입 정의
 * - like: 좋아요
 * - scrap: 스크랩
 * - bookmark: 북마크
 */
export type InteractionType = 'like' | 'scrap' | 'bookmark'

/**
 * 상호작용 대상 타입 정의
 * - post: 게시글
 * - place: 장소
 */
export type TargetType = 'post' | 'place'

/**
 * Interaction 엔티티 - 통합 상호작용 관리
 * 
 * 주요 특징:
 * - 통합 테이블로 like, scrap, bookmark 관리
 * - 정책:
 *   - bookmark → place 전용
 *   - like, scrap → post 전용 (단, post_type이 community 또는 trend일 때만 허용)
 * - DB 트리거로 정책 강제
 * - UNIQUE 제약으로 중복 방지
 */
@Entity({ name: 'interactions' })
@Unique('unique_interaction', ['user', 'interactionType', 'targetType', 'targetId'])
export class Interaction {
	@ApiProperty({ description: '상호작용 ID (BIGINT UNSIGNED, AUTO_INCREMENT)' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: '사용자 ID (users.id 참조)' })
	@Index()
	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'user_id' })
	user!: User

	@ApiProperty({ 
		description: '상호작용 타입',
		enum: ['like', 'scrap', 'bookmark'],
		example: 'like'
	})
	@Index()
	@Column({ 
		type: 'enum', 
		enum: ['like', 'scrap', 'bookmark'], 
		nullable: false 
	})
	interactionType!: InteractionType

	@ApiProperty({ 
		description: '대상 타입',
		enum: ['post', 'place'],
		example: 'post'
	})
	@Index()
	@Column({ 
		type: 'enum', 
		enum: ['post', 'place'], 
		nullable: false 
	})
	targetType!: TargetType

	@ApiProperty({ description: '대상 ID (post.id 또는 place.id)' })
	@Index()
	@Column({ type: 'bigint', unsigned: true, nullable: false })
	targetId!: number

	@ApiProperty({ description: '생성일시' })
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	createdAt!: Date
}
```

### 3.2 InteractionsService

**파일**: `src/features/interactions/interactions.service.ts`

```typescript
// src/features/interactions/interactions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindManyOptions } from 'typeorm'
import { Interaction, InteractionType, TargetType } from './interaction.entity'
import { Post } from '../posts/post.entity'
import { Place } from '../places/place.entity'
import { User } from '../users/user.entity'
import { CreateInteractionDto, GetInteractionsQueryDto, InteractionResponseDto, InteractionStatsDto } from './interactions.dto'

/**
 * InteractionsService - 통합 상호작용 관리
 * 
 * 주요 기능:
 * - like, scrap, bookmark 통합 관리
 * - 정책:
 *   - bookmark → place 전용
 *   - like, scrap → post 전용 (단, post_type이 community 또는 trend일 때만 허용)
 */
@Injectable()
export class InteractionsService {
	constructor(
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(Place) private readonly placeRepo: Repository<Place>,
		@InjectRepository(User) private readonly userRepo: Repository<User>
	) {}

	/**
	 * 상호작용 생성/토글
	 * - 이미 존재하면 삭제 (토글 방식)
	 */
	async toggleInteraction(userId: number, createInteractionDto: CreateInteractionDto): Promise<{ action: 'created' | 'deleted', interaction?: InteractionResponseDto }> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// 정책 검증
		await this.validateInteractionPolicy(createInteractionDto)

		// 기존 상호작용 확인
		const existingInteraction = await this.interactionRepo.findOne({
			where: {
				user: { id: userId },
				interactionType: createInteractionDto.interactionType,
				targetType: createInteractionDto.targetType,
				targetId: createInteractionDto.targetId
			},
			relations: ['user']
		})

		if (existingInteraction) {
			// 기존 상호작용 삭제 (토글)
			await this.interactionRepo.delete(existingInteraction.id)
			return { action: 'deleted' }
		} else {
			// 새 상호작용 생성
			const interaction = this.interactionRepo.create({
				user,
				interactionType: createInteractionDto.interactionType,
				targetType: createInteractionDto.targetType,
				targetId: createInteractionDto.targetId
			})

			const savedInteraction = await this.interactionRepo.save(interaction)
			return { 
				action: 'created', 
				interaction: this.formatInteractionResponse(savedInteraction)
			}
		}
	}

	/**
	 * 대상별 상호작용 통계 조회
	 */
	async getInteractionStats(targetType: TargetType, targetId: number, userId?: number): Promise<InteractionStatsDto> {
		const [likeCount, scrapCount, bookmarkCount] = await Promise.all([
			this.interactionRepo.count({
				where: { targetType, targetId, interactionType: 'like' }
			}),
			this.interactionRepo.count({
				where: { targetType, targetId, interactionType: 'scrap' }
			}),
			this.interactionRepo.count({
				where: { targetType, targetId, interactionType: 'bookmark' }
			})
		])

		let userInteractions = { liked: false, scrapped: false, bookmarked: false }

		if (userId) {
			const [liked, scrapped, bookmarked] = await Promise.all([
				this.interactionRepo.findOne({
					where: { user: { id: userId }, targetType, targetId, interactionType: 'like' }
				}),
				this.interactionRepo.findOne({
					where: { user: { id: userId }, targetType, targetId, interactionType: 'scrap' }
				}),
				this.interactionRepo.findOne({
					where: { user: { id: userId }, targetType, targetId, interactionType: 'bookmark' }
				})
			])

			userInteractions = {
				liked: !!liked,
				scrapped: !!scrapped,
				bookmarked: !!bookmarked
			}
		}

		return {
			likeCount,
			scrapCount,
			bookmarkCount,
			userInteractions
		}
	}

	/**
	 * 상호작용 정책 검증
	 */
	private async validateInteractionPolicy(dto: CreateInteractionDto): Promise<void> {
		if (dto.interactionType === 'bookmark') {
			// bookmark는 place 전용
			if (dto.targetType !== 'place') {
				throw new ForbiddenException('북마크는 장소에만 사용할 수 있습니다.')
			}
			
			// 대상 장소 존재 확인
			const place = await this.placeRepo.findOne({ where: { id: dto.targetId } })
			if (!place) {
				throw new NotFoundException('대상 장소를 찾을 수 없습니다.')
			}
		} else {
			// like, scrap은 post 전용
			if (dto.targetType !== 'post') {
				throw new ForbiddenException('좋아요/스크랩은 게시글에만 사용할 수 있습니다.')
			}

			// 대상 게시글 존재 확인 및 타입 검증
			const post = await this.postRepo.findOne({ where: { id: dto.targetId } })
			if (!post) {
				throw new NotFoundException('대상 게시글을 찾을 수 없습니다.')
			}

			// community, trend에만 허용
			if (post.postType !== 'community' && post.postType !== 'trend') {
				throw new ForbiddenException('community, trend 게시글에만 좋아요/스크랩을 사용할 수 있습니다.')
			}
		}
	}
}
```

---

## 4. 모듈 통합

### 4.1 AppModule 업데이트

**파일**: `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

// feature modules
import { AuthModule } from './features/auth/auth.module'
import { PlacesModule } from './features/places/places.module'
import { PostsModule } from './features/posts/posts.module'
import { CommentsModule } from './features/comments/comments.module'
import { InteractionsModule } from './features/interactions/interactions.module'

/**
 * App Module - K-Mate 애플리케이션 메인 모듈
 * 
 * 주요 기능:
 * - 전역 설정 관리 (환경변수, 데이터베이스)
 * - 인증 시스템 (Google OAuth + JWT)
 * - 장소 관리 시스템 (Google Places API)
 * - 게시글 관리 시스템 (K-Buzz)
 * - 댓글 관리 시스템
 * - 상호작용 관리 시스템 (like, scrap, bookmark)
 */
@Module({
	imports: [
		// .env 로드 (전역)
		ConfigModule.forRoot({ isGlobal: true }),

		// DB설정은 DatabaseModule에서 import
		DatabaseModule,

		// features - ERD 구조에 따른 모듈 구성
		AuthModule,           // 인증 시스템 (Google OAuth + JWT)
		PlacesModule,         // 장소 관리 시스템 (Google Places API)
		PostsModule,          // 게시글 관리 시스템 (K-Buzz)
		CommentsModule,       // 댓글 관리 시스템
		InteractionsModule,   // 상호작용 관리 시스템 (like, scrap, bookmark)

	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
```

---

## 📊 API 엔드포인트 요약

### Posts API
```
POST   /posts                    # 게시글 생성
GET    /posts                    # 게시글 목록 (필터링, 검색, 페이지네이션)
GET    /posts/:id                # 게시글 상세 조회
PUT    /posts/:id                # 게시글 수정
DELETE /posts/:id                # 게시글 삭제
GET    /posts/user/:userId       # 사용자별 게시글 조회
```

### Comments API
```
POST   /comments/post/:postId    # 댓글 생성
GET    /comments/post/:postId    # 게시글별 댓글 목록
GET    /comments/:id             # 댓글 상세 조회
PUT    /comments/:id             # 댓글 수정
DELETE /comments/:id             # 댓글 삭제
GET    /comments/user/:userId    # 사용자별 댓글 목록
```

### Interactions API
```
POST   /interactions/toggle      # 상호작용 토글 (생성/삭제)
GET    /interactions             # 상호작용 목록 조회
GET    /interactions/user/:userId # 사용자별 상호작용 목록
GET    /interactions/stats/:targetType/:targetId # 상호작용 통계
DELETE /interactions/:id         # 상호작용 삭제
```

---

## 🎯 구현 특징

1. **기존 패턴 준수**: 모든 코드가 기존 Places API와 동일한 패턴으로 구현
2. **TypeORM 활용**: Repository 패턴과 의존성 주입 사용
3. **Swagger 문서화**: 완전한 API 문서화
4. **정책 기반 제어**: 게시글 타입별 권한 및 상호작용 정책
5. **페이지네이션**: 모든 리스트 API에 페이지네이션 적용
6. **검증 및 보안**: class-validator와 JWT 가드 사용
7. **에러 처리**: 일관된 예외 처리 방식

이제 K-Mate는 완전한 소셜 플랫폼으로서 K-Buzz 기능을 제공할 수 있습니다! 🚀
