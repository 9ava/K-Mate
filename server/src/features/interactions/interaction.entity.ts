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
