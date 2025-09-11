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
import { Post } from '../posts/post.entity'

/** 상호작용 타입 */
export type InteractionType = 'like' | 'scrap'

/**
 * Interaction 엔티티 (post 전용)
 * - like / scrap
 * - 한 유저가 같은 게시글에 같은 행동은 1회만 (UNIQUE)
 */
@Entity({ name: 'interactions' })
@Unique('uniq_user_post_interaction', ['user', 'post', 'interactionType'])
export class Interaction {
	@ApiProperty({ description: '상호작용 ID' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: '사용자 ID (users.id)' })
	@Index()
	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'user_id' })
	user!: User

	@ApiProperty({ description: '대상 게시글 ID (posts.id)' })
	@Index()
	@ManyToOne(() => Post, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'post_id' })
	post!: Post

	@ApiProperty({ description: '상호작용 타입', enum: ['like', 'scrap'], example: 'like' })
	@Index()
	@Column({ name: 'interaction_type', type: 'enum', enum: ['like', 'scrap'], nullable: false })
	interactionType!: InteractionType

	@ApiProperty({ description: '생성일시' })
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	createdAt!: Date
}
