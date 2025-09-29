// src/features/comments/course-comment.entity.ts
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
import { Course } from '../courses/course.entity'

/**
 * CourseComment 엔티티 - 코스 댓글 관리
 *
 * 주요 특징:
 * - 여행 코스에 대한 댓글 기능
 * - CASCADE 삭제로 코스 삭제 시 댓글도 함께 삭제
 */
@Entity({ name: 'course_comments' })
export class CourseComment {
	@ApiProperty({ description: '댓글 ID (BIGINT UNSIGNED, AUTO_INCREMENT)' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: '코스 ID (courses.id 참조)' })
	@Index()
	@ManyToOne(() => Course, { onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'course_id' })
	course!: Course

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
