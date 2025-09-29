import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Course } from './course.entity'
import { CourseStop } from './course-stop.entity'
import { SavedCourse } from './saved-course.entity'
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
		@InjectRepository(SavedCourse) private readonly savedCourseRepo: Repository<SavedCourse>,
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
				category: dto.category ?? 'all',
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
	 * - 광고가 먼저, 그 다음 최신 생성일 순으로 정렬
	 *
	 * @param page 페이지 번호 (1부터 시작)
	 * @param limit 페이지당 항목 수
	 * @returns 공개 코스 목록과 페이지네이션 정보
	 */
	async getPublicCourses(page: number = 1, limit: number = 10) {
		const [courses, total] = await this.courseRepo.findAndCount({
			where: { visibility: 'public' },
			relations: ['author', 'stops'],
			order: {
				isAdvertisement: 'DESC', // 광고를 먼저 정렬
				created_at: 'DESC', // 그 다음 최신순
			},
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

	/**
	 * 관리자용 모든 코스 목록 조회 (페이지네이션)
	 * - 공개/비공개 모든 코스 반환
	 * - 광고가 먼저, 그 다음 최신 생성일 순으로 정렬
	 *
	 * @param page 페이지 번호 (1부터 시작)
	 * @param limit 페이지당 항목 수
	 * @returns 모든 코스 목록과 페이지네이션 정보
	 */
	async getAllCoursesForAdmin(page: number = 1, limit: number = 10) {
		const [courses, total] = await this.courseRepo.findAndCount({
			// visibility 조건 없음 - 모든 코스 조회
			relations: ['author', 'stops'],
			order: {
				isAdvertisement: 'DESC', // 광고를 먼저 정렬
				created_at: 'DESC', // 그 다음 최신순
			},
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

	/**
	 * 코스 업데이트
	 * - 작성자만 수정 가능
	 * - 기존 경유지들을 삭제하고 새로운 경유지들로 교체
	 *
	 * @param id 수정할 코스 ID
	 * @param dto 수정할 코스 데이터
	 * @param requesterId 요청자 ID
	 * @returns 수정된 코스 정보
	 */
	async update(id: string, dto: CreateCourseDto, requesterId: string) {
		return this.dataSource.transaction(async (manager) => {
			// 1. 기존 코스 조회 및 권한 확인
			const course = await manager.findOne(Course, { where: { id } })
			if (!course) {
				throw new NotFoundException('Course not found')
			}
			if (String(course.authorId) !== String(requesterId)) {
				throw new ForbiddenException('Only the author can update this course')
			}

			// 2. 코스 기본 정보 업데이트
			await manager.update(Course, id, {
				title: dto.title,
				visibility: dto.visibility,
				category: dto.category ?? 'all',
				updated_at: new Date(),
			})

			// 3. 기존 경유지들 삭제
			await manager.delete(CourseStop, { course: { id } })

			// 4. 새로운 경유지들 생성
			if (dto.stops.length > 0) {
				const stops = dto.stops.map((s) =>
					manager.create(CourseStop, {
						course: { id } as Course,
						order: s.order,
						name: s.name,
						lat: s.lat,
						lng: s.lng,
						externalId: s.externalId ?? null,
					})
				)
				await manager.save(stops)
			}

			// 5. 업데이트된 코스 반환
			return await manager.findOne(Course, {
				where: { id },
				relations: ['author', 'stops'],
				order: { stops: { order: 'ASC' } },
			})
		})
	}

	/**
	 * 코스 삭제
	 * - 작성자만 삭제 가능
	 * - 관련된 경유지들도 함께 삭제 (CASCADE)
	 *
	 * @param id 삭제할 코스 ID
	 * @param requesterId 요청자 ID
	 */
	async delete(id: string, requesterId: string) {
		const course = await this.courseRepo.findOne({ where: { id } })
		if (!course) {
			throw new NotFoundException('Course not found')
		}
		if (String(course.authorId) !== String(requesterId)) {
			throw new ForbiddenException('Only the author can delete this course')
		}

		await this.courseRepo.delete(id)
	}

	/**
	 * 코스 저장/북마크
	 * - 다른 사용자의 코스를 내 목록에 저장
	 * - 자신의 코스는 저장할 수 없음
	 * - 이미 저장한 코스는 중복 저장 불가
	 *
	 * @param courseId 저장할 코스 ID
	 * @param userId 사용자 ID
	 */
	async saveCourse(courseId: string, userId: string) {
		// 1. 코스 존재 확인
		const course = await this.courseRepo.findOne({ where: { id: courseId } })
		if (!course) {
			throw new NotFoundException('Course not found')
		}

		// 2. 자신의 코스는 저장할 수 없음
		if (String(course.authorId) === String(userId)) {
			throw new BadRequestException('Cannot save your own course')
		}

		// 3. 이미 저장했는지 확인
		const existing = await this.savedCourseRepo.findOne({
			where: { courseId: Number(course.id), userId: Number(userId) },
		})
		if (existing) {
			throw new BadRequestException('Course already saved')
		}

		// 4. 저장 레코드 생성
		const savedCourse = this.savedCourseRepo.create({
			courseId: Number(course.id),
			userId: Number(userId),
		})
		await this.savedCourseRepo.save(savedCourse)

		// 5. 저장 횟수 증가
		await this.courseRepo.update(courseId, {
			saveCount: () => 'save_count + 1',
		})
	}

	/**
	 * 코스 저장 취소
	 * - 저장했던 코스를 내 목록에서 제거
	 *
	 * @param courseId 저장 취소할 코스 ID
	 * @param userId 사용자 ID
	 */
	async unsaveCourse(courseId: string, userId: string) {
		const result = await this.savedCourseRepo.delete({
			courseId: Number(courseId),
			userId: Number(userId),
		})

		if (result.affected === 0) {
			throw new NotFoundException('Saved course not found')
		}

		// 저장 횟수 감소 (0 이하로는 내려가지 않게)
		await this.courseRepo
			.createQueryBuilder()
			.update(Course)
			.set({ saveCount: () => 'GREATEST(save_count - 1, 0)' })
			.where('id = :id', { id: courseId })
			.execute()
	}

	/**
	 * 저장된 코스 목록 조회
	 * - 내가 저장한 다른 사용자의 코스들
	 * - 최신 저장일 순으로 정렬
	 *
	 * @param userId 사용자 ID
	 * @returns 저장된 코스 목록
	 */
	async getSavedCourses(userId: string) {
		const savedCourses = await this.savedCourseRepo.find({
			where: { userId: Number(userId) },
			relations: ['course', 'course.author', 'course.stops'],
			order: { savedAt: 'DESC' },
		})

		return savedCourses.map((sc) => sc.course)
	}

	/**
	 * 코스 광고 상태 토글
	 * - 관리자만 수행 가능
	 *
	 * @param id 코스 ID
	 * @param isAdvertisement 광고 설정 여부
	 */
	async toggleAdvertisement(id: string, isAdvertisement: boolean) {
		const course = await this.courseRepo.findOne({ where: { id } })
		if (!course) {
			throw new NotFoundException('코스를 찾을 수 없습니다')
		}

		course.isAdvertisement = isAdvertisement
		await this.courseRepo.save(course)

		return course
	}

	/**
	 * 코스 공개/비공개 상태 토글
	 * - 관리자만 수행 가능
	 *
	 * @param id 코스 ID
	 * @param visibility 공개 설정 ('public' | 'private')
	 */
	async toggleVisibility(id: string, visibility: 'public' | 'private') {
		const course = await this.courseRepo.findOne({ where: { id } })
		if (!course) {
			throw new NotFoundException('코스를 찾을 수 없습니다')
		}

		course.visibility = visibility
		await this.courseRepo.save(course)

		return course
	}

	/**
	 * 코스 공유
	 * - 공유 횟수를 증가시킴
	 *
	 * @param courseId 공유할 코스 ID
	 */
	async shareCourse(courseId: string) {
		const course = await this.courseRepo.findOne({ where: { id: courseId } })
		if (!course) {
			throw new NotFoundException('코스를 찾을 수 없습니다')
		}

		// 공유 횟수 증가
		await this.courseRepo.update(courseId, {
			shareCount: () => 'share_count + 1',
		})

		return course
	}

	/**
	 * 월별 Best 코스 조회
	 * - 전체 기간 중 공유 + 저장 횟수 기준으로 인기 코스 조회
	 * - 광고 코스가 먼저 표시됨
	 *
	 * @param limit 조회할 개수 (기본값: 9)
	 * @returns 인기 코스 목록 (월별 Best)
	 */
	async getMonthlyBestCourses(year?: number, month?: number, limit: number = 9) {
		try {
			// year, month 파라미터는 호환성을 위해 유지하지만 실제로는 사용하지 않음

			const courses = await this.courseRepo
				.createQueryBuilder('course')
				.leftJoinAndSelect('course.author', 'author')
				.leftJoinAndSelect('course.stops', 'stops')
				.where('course.visibility = :visibility', { visibility: 'public' })
				.orderBy('course.is_advertisement', 'DESC')
				.addOrderBy('(course.share_count + course.save_count)', 'DESC')
				.addOrderBy('course.created_at', 'DESC')
				.limit(limit)
				.getMany()

			return courses
		} catch (error) {
			console.error('getMonthlyBestCourses error:', error)
			// 에러 발생 시 빈 배열 반환하는 대신 간단한 쿼리로 폴백
			try {
				const fallbackCourses = await this.courseRepo
					.createQueryBuilder('course')
					.leftJoinAndSelect('course.author', 'author')
					.leftJoinAndSelect('course.stops', 'stops')
					.where('course.visibility = :visibility', { visibility: 'public' })
					.orderBy('course.created_at', 'DESC')
					.limit(limit)
					.getMany()

				return fallbackCourses
			} catch (fallbackError) {
				console.error('Fallback query also failed:', fallbackError)
				throw new NotFoundException('코스를 찾을 수 없습니다')
			}
		}
	}
}
