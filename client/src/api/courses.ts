// src/api/courses.ts

import type {
	CreateCourseRequest,
	CreateCourseResponse,
	GetCoursesResponse,
	GetCourseResponse,
} from '../types/course'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * 여행 코스 API 클라이언트
 * 백엔드 courses 엔드포인트와 통신
 */

/**
 * 새로운 여행 코스 생성
 * @param courseData 생성할 코스 데이터
 * @returns 생성된 코스 정보
 */
export async function createCourse(courseData: CreateCourseRequest): Promise<CreateCourseResponse> {
	const response = await fetch(`${API_BASE}/courses`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include', // JWT 쿠키 인증을 위해 필수
		body: JSON.stringify(courseData),
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to create course: ${response.status}`)
	}

	return response.json()
}

/**
 * 내 코스 목록 조회
 * @returns 내가 작성한 코스 목록
 */
export async function getMyCourses(): Promise<GetCoursesResponse> {
	const response = await fetch(`${API_BASE}/courses?me=true`, {
		method: 'GET',
		credentials: 'include', // JWT 쿠키 인증을 위해 필수
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch my courses: ${response.status}`)
	}

	return response.json()
}

/**
 * 공개 코스 목록 조회 (페이지네이션)
 * @param page 페이지 번호 (기본값: 1)
 * @param limit 페이지당 항목 수 (기본값: 10)
 * @returns 공개 코스 목록과 페이지네이션 정보
 */
export async function getPublicCourses(
	page: number = 1,
	limit: number = 10
): Promise<GetCoursesResponse> {
	const url = `${API_BASE}/courses/public?page=${page}&limit=${limit}`
	console.log('Fetching public courses from:', url)

	const response = await fetch(url, {
		method: 'GET',
		// 공개 코스는 인증 불필요
	})

	console.log('Response status:', response.status)
	console.log('Response headers:', response.headers)

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		console.error('Error response text:', errorText)
		throw new Error(errorText || `Failed to fetch public courses: ${response.status}`)
	}

	const responseText = await response.text()
	console.log('Response text:', responseText.substring(0, 200))

	try {
		return JSON.parse(responseText)
	} catch (parseError) {
		console.error('JSON parse error:', parseError)
		console.error('Full response text:', responseText)
		throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
	}
}

/**
 * 특정 코스 상세 조회
 * @param courseId 조회할 코스 ID
 * @returns 코스 상세 정보
 */
export async function getCourse(courseId: string): Promise<GetCourseResponse> {
	const response = await fetch(`${API_BASE}/courses/${courseId}`, {
		method: 'GET',
		credentials: 'include', // 비공개 코스 접근을 위해 쿠키 포함
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch course: ${response.status}`)
	}

	return response.json()
}

/**
 * 코스 업데이트
 * @param courseId 수정할 코스 ID
 * @param courseData 수정할 코스 데이터
 * @returns 수정된 코스 정보
 */
export async function updateCourse(courseId: string, courseData: CreateCourseRequest): Promise<GetCourseResponse> {
	const response = await fetch(`${API_BASE}/courses/${courseId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify(courseData),
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to update course: ${response.status}`)
	}

	return response.json()
}

/**
 * 코스 삭제
 * @param courseId 삭제할 코스 ID
 */
export async function deleteCourse(courseId: string): Promise<{ success: boolean; message: string }> {
	const response = await fetch(`${API_BASE}/courses/${courseId}`, {
		method: 'DELETE',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to delete course: ${response.status}`)
	}

	return response.json()
}

/**
 * 코스 저장/북마크
 * @param courseId 저장할 코스 ID
 * @returns 저장 성공 메시지
 */
export async function saveCourse(courseId: string): Promise<{ success: boolean; message: string }> {
	const response = await fetch(`${API_BASE}/courses/${courseId}/save`, {
		method: 'POST',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to save course: ${response.status}`)
	}

	return response.json()
}

/**
 * 코스 저장 취소
 * @param courseId 저장 취소할 코스 ID
 * @returns 저장 취소 성공 메시지
 */
export async function unsaveCourse(courseId: string): Promise<{ success: boolean; message: string }> {
	const response = await fetch(`${API_BASE}/courses/${courseId}/save`, {
		method: 'DELETE',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to unsave course: ${response.status}`)
	}

	return response.json()
}

/**
 * 저장된 코스 목록 조회
 * @returns 내가 저장한 코스 목록
 */
export async function getSavedCourses(): Promise<GetCoursesResponse> {
	const response = await fetch(`${API_BASE}/courses/saved/list`, {
		method: 'GET',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch saved courses: ${response.status}`)
	}

	return response.json()
}