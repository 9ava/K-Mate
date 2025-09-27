import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	Index,
	JoinColumn,
} from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { User } from '../users/user.entity'
import { CourseStop } from './course-stop.entity'

export type CourseVisibility = 'public' | 'private'

/**
 * 여행 코스 엔티티
 * 사용자가 작성한 여행 경로와 경유지들을 관리합니다.
 */
@Entity({ name: 'courses' })
export class Course {
	@ApiProperty({
		description: '코스 고유 ID',
		example: '123',
		type: 'string',
	})
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: string

	@ApiProperty({
		description: '코스 제목',
		example: '서울 궁궐 투어',
		maxLength: 150,
	})
	@Column({ type: 'varchar', length: 150 })
	title!: string

	@ApiProperty({
		description: '코스 공개 설정',
		example: 'public',
		enum: ['public', 'private'],
	})
	@Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
	visibility!: CourseVisibility

	/** ✅ authorId 컬럼을 명시적으로 둬서 id만으로도 세팅/조회 쉬움 */
	@ApiProperty({
		description: '작성자 ID',
		example: '456',
		type: 'string',
	})
	@Index()
	@Column({ type: 'bigint', unsigned: true, name: 'authorId' })
	authorId!: string

	/**
	 * ✅ FK만 걸어두는 소유측 관계 (역방향 OneToMany는 선택)
	 * - 저장 시:  authorId = '123'  로만 저장해도 OK
	 * - 필요 시:  author: { id: 123 } 로 save 하거나 relations로 조인해서 사용
	 */
	@ApiPropertyOptional({
		description: '작성자 정보',
		type: () => User,
	})
	@ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'authorId' })
	author!: User

	/**
	 * 코스 내 스톱들
	 * - insert/update는 cascade 허용
	 * - 스톱이 배열에서 제거되면 자동 삭제하고 싶으면 orphanedRowAction: 'delete' 추가
	 */
	@ApiPropertyOptional({
		description: '코스 경유지 목록',
		type: () => [CourseStop],
	})
	@OneToMany(() => CourseStop, (s) => s.course, {
		cascade: ['insert', 'update'],
		orphanedRowAction: 'delete',
	})
	stops!: CourseStop[]

	@ApiProperty({
		description: '생성일시',
		example: '2024-01-01T00:00:00.000Z',
	})
	@Index()
	@CreateDateColumn({ type: 'datetime' })
	created_at!: Date

	@ApiProperty({
		description: '수정일시',
		example: '2024-01-01T00:00:00.000Z',
	})
	@UpdateDateColumn({ type: 'datetime' })
	updated_at!: Date

	@ApiProperty({
		description: '광고 여부',
		example: false,
	})
	@Column({ name: 'is_advertisement', type: 'boolean', default: false })
	isAdvertisement!: boolean

	@ApiProperty({
		description: '공유 횟수',
		example: 0,
	})
	@Column({ name: 'share_count', type: 'int', default: 0 })
	shareCount!: number

	@ApiProperty({
		description: '저장 횟수',
		example: 0,
	})
	@Column({ name: 'save_count', type: 'int', default: 0 })
	saveCount!: number
}
