import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, Unique } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Course } from './course.entity'

/**
 * 여행 코스 경유지 엔티티
 * 코스 내의 개별 방문 장소를 관리합니다.
 */
@Entity({ name: 'course_stops' })
@Unique(['course', 'order']) // 같은 코스에서 order 중복 방지
export class CourseStop {
	@ApiProperty({
		description: '스톱 고유 ID',
		example: '789',
		type: 'string',
	})
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: string

	@ApiProperty({
		description: '소속 코스',
		type: () => Course,
	})
	@Index()
	@ManyToOne(() => Course, (c) => c.stops, { nullable: false, onDelete: 'CASCADE' })
	course!: Course

	@ApiProperty({
		description: '스톱 순서 (1부터 시작)',
		example: 1,
		minimum: 1,
	})
	@Column({ type: 'int', unsigned: true })
	order!: number

	@ApiProperty({
		description: '장소 이름',
		example: '경복궁',
		maxLength: 120,
	})
	@Column({ type: 'varchar', length: 120 })
	name!: string

	@ApiProperty({
		description: '위도 (latitude)',
		example: 37.5796,
		type: 'number',
	})
	@Column({ type: 'double' }) // 위경도는 double 추천
	lat!: number

	@ApiProperty({
		description: '경도 (longitude)',
		example: 126.977,
		type: 'number',
	})
	@Column({ type: 'double' })
	lng!: number

	@ApiPropertyOptional({
		description: '외부 서비스 장소 ID (Google Places)',
		example: 'ChIJzaOKGAiafDURdKWEEJfhCQY',
		nullable: true,
	})
	@Column({ type: 'varchar', length: 128, nullable: true })
	externalId!: string | null // Google Place ID
}
