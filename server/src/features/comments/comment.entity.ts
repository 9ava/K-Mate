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
