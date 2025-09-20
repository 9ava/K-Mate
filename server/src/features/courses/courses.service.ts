import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Course } from './course.entity'
import { CourseStop } from './course-stop.entity'
import { CreateCourseDto } from './create-course.dto'

/**
 * 여행 코스 서비스
 * - 코스 생성, 조회, 수정, 삭제 로직 처리
 * - 트랜잭션을 통한 데이터 일관성 보장
 * - 접근 권한 제어 (공개/비공개)
 */
@Injectable()
export class CoursesService {
	constructor(
		@InjectRepository(Course) private readonly courseRepo: Repository<Course>,
		@InjectRepository(CourseStop) private readonly stopRepo: Repository<CourseStop>,
		private readonly dataSource: DataSource
	) {}

	/**
	 * 새로운 여행 코스 생성
	 * - 트랜잭션으로 Course와 CourseStop을 원자적으로 생성
	 * - stops 배열의 order 순서대로 경유지 저장
	 * 
	 * @param dto 코스 생성 데이터
	 * @param authorId 작성자 ID
	 * @returns 생성된 코스 정보 (id, title)
	 */
	async create(dto: CreateCourseDto, authorId: string) {
		return this.dataSource.transaction(async (manager) => {
			// 1. 코스 기본 정보 생성
			const course = manager.create(Course, {
				title: dto.title,
				visibility: dto.visibility,
				authorId: authorId, // string을 그대로 사용 (bigint는 string으로 처리)
			})
			await manager.save(course)

			// 2. 경유지들 생성 (order 순서대로)
			const stops = dto.stops.map((s) =>
				manager.create(CourseStop, {
					course,
					order: s.order,
					name: s.name,
					lat: s.lat,
					lng: s.lng,
					externalId: s.externalId ?? null,
					provider: s.provider ?? null,
				})
			)
			await manager.save(stops)

			// 3. 생성 결과 반환 (필요 필드만)
			return { id: course.id, title: course.title }
		})
	}

	/**
	 * 특정 코스 상세 조회
	 * - 코스와 경유지, 작성자 정보를 함께 조회
	 * - 비공개 코스는 작성자만 접근 가능
	 * 
	 * @param id 조회할 코스 ID
	 * @param requesterId 요청자 ID (옵셔널)
	 * @returns 코스 상세 정보
	 * @throws NotFoundException 코스를 찾을 수 없는 경우
	 * @throws ForbiddenException 비공개 코스에 권한 없이 접근하는 경우
	 */
	async findOne(id: string, requesterId?: string) {
		const course = await this.courseRepo.findOne({
			where: { id },
			relations: ['author', 'stops'],
			order: { stops: { order: 'ASC' } }, // 경유지를 순서대로 정렬
		})
		
		if (!course) {
			throw new NotFoundException('Course not found')
		}

		// 비공개 코스는 소유자만 열람 가능
		if (course.visibility === 'private' && String(course.authorId) !== String(requesterId)) {
			throw new ForbiddenException('Access denied to private course')
		}
		
		return course
	}

	/**
	 * 특정 사용자의 코스 목록 조회
	 * - 작성자 본인의 모든 코스 (공개/비공개 포함)
	 * - 최신 생성일 순으로 정렬
	 * 
	 * @param authorId 작성자 ID
	 * @returns 해당 사용자의 코스 목록
	 */
	async findMine(authorId: string) {
		return this.courseRepo.find({
			where: { authorId },
			relations: ['stops'],
			order: { created_at: 'DESC' },
		})
	}

	/**
	 * 공개 코스 목록 조회 (페이지네이션)
	 * - visibility='public'인 코스만 반환
	 * - 최신 생성일 순으로 정렬
	 * 
	 * @param page 페이지 번호 (1부터 시작)
	 * @param limit 페이지당 항목 수
	 * @returns 공개 코스 목록과 페이지네이션 정보
	 */
	async getPublicCourses(page: number = 1, limit: number = 10) {
		const [courses, total] = await this.courseRepo.findAndCount({
			where: { visibility: 'public' },
			relations: ['author', 'stops'],
			order: { created_at: 'DESC' },
			skip: (page - 1) * limit,
			take: limit,
		})

		return {
			courses,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}
}
