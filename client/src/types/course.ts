// src/types/course.ts

/**
 * 여행 코스 관련 타입 정의
 * 백엔드 API와 동기화된 타입들
 */

export type CourseVisibility = 'public' | 'private'

export interface CourseStop {
	id: string
	order: number
	name: string
	lat: number
	lng: number
	externalId?: string | null
	provider?: string | null
}

export interface Course {
	id: string
	title: string
	visibility: CourseVisibility
	authorId: string
	author?: {
		id: string
		email: string
		name?: string
	}
	stops: CourseStop[]
	created_at: string
	updated_at: string
}

// API 요청/응답 타입들
export interface CreateCourseRequest {
	title: string
	visibility: CourseVisibility
	stops: {
		order: number
		name: string
		lat: number
		lng: number
		externalId?: string
		provider?: string
	}[]
}

export interface CreateCourseResponse {
	success: boolean
	data: {
		id: string
		title: string
	}
}

export interface GetCoursesResponse {
	success: boolean
	data: Course[] | {
		myCourses: Course[]
		savedCourses: Course[]
	}
	pagination?: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

export interface GetCourseResponse {
	success: boolean
	data: Course
}