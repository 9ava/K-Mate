// src/features/places/place-bookmark.entity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	Unique,
	Index,
	CreateDateColumn,
} from 'typeorm'
import { User } from '../users/user.entity'
import { Place } from './place.entity'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 장소 북마크
 * - 사용자(user_id) ↔ 장소(place) 유니크 매핑
 */
@Entity({ name: 'place_bookmarks' })
@Unique('uniq_user_place', ['user', 'place'])
export class PlaceBookmark {
	@ApiProperty({ description: '내부 PK (BIGINT UNSIGNED, AUTO_INCREMENT)' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: 'users.id (BIGINT UNSIGNED)' })
	@Index()
	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'user_id' })
	user!: User

	@ApiProperty({ description: 'Place 엔티티 FK (CASCADE 삭제)' })
	@ManyToOne(() => Place, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'place_id' })
	place!: Place

	@CreateDateColumn({ name: 'created_at', type: 'datetime' })
	createdAt!: Date
}
