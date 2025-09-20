import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index, Column } from 'typeorm'
import { Course } from './course.entity'
import { User } from '../users/user.entity'

/**
 * 저장된 코스 엔티티
 * - 사용자가 다른 사용자의 코스를 저장/북마크할 때 사용
 */
@Entity('saved_courses')
@Index(['userId', 'courseId'], { unique: true }) // 동일한 사용자가 같은 코스를 중복 저장하지 못하도록
export class SavedCourse {
	@PrimaryGeneratedColumn()
	id: number

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User

	@Column({ name: 'user_id' })
	userId: number

	@ManyToOne(() => Course, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'course_id' })
	course: Course

	@Column({ name: 'course_id' })
	courseId: number

	@CreateDateColumn({ name: 'saved_at' })
	savedAt: Date
}