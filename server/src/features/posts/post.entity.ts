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
