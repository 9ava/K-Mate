// src/features/mypage/mypage.dto.ts - 마이페이지 DTO 정의
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsNumber, Min, Max, IsEnum, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'

// ────────────────────────────────────────────────────────────────────────────
// 사용자 활동 통계 DTO
// ────────────────────────────────────────────────────────────────────────────
export class UserActivityStatsDto {
	@ApiProperty({ description: '북마크한 장소 수' })
	bookmarkCount!: number

	@ApiProperty({ description: '스크랩한 글 수' })
	scrapCount!: number

	@ApiProperty({ description: '작성한 게시글 수' })
	postCount!: number

	@ApiProperty({ description: '작성한 댓글 수' })
	commentCount!: number

	@ApiProperty({ description: '작성한 코스 수' })
	courseCount!: number

	@ApiProperty({ description: '저장한 코스 수' })
	savedCourseCount!: number
}

// ────────────────────────────────────────────────────────────────────────────
// 페이지네이션 쿼리 DTO
// ────────────────────────────────────────────────────────────────────────────
export class PaginationQueryDto {
	@ApiProperty({ description: '페이지 번호', required: false, default: 1, minimum: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page?: number = 1

	@ApiProperty({ description: '페이지당 항목 수', required: false, default: 10, minimum: 1, maximum: 100 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 10
}

// ────────────────────────────────────────────────────────────────────────────
// 북마크 목록 응답 DTO
// ────────────────────────────────────────────────────────────────────────────
export class BookmarkItemDto {
	@ApiProperty({ description: '북마크 ID' })
	id!: number

	@ApiProperty({ description: 'Google Place ID' })
	placeId!: string

	@ApiProperty({ description: '장소명' })
	name!: string

	@ApiProperty({ description: '주소' })
	address!: string

	@ApiProperty({ description: '위도' })
	lat!: number

	@ApiProperty({ description: '경도' })
	lng!: number

	@ApiProperty({ description: 'Google Maps URL' })
	googleMapsUrl!: string

	@ApiProperty({ description: '장소 타입', required: false })
	type?: string

	@ApiProperty({ description: '북마크 생성일' })
	createdAt!: Date
}

export class BookmarkListResponseDto {
	@ApiProperty({ description: '북마크 목록', type: [BookmarkItemDto] })
	bookmarks!: BookmarkItemDto[]

	@ApiProperty({ description: '전체 개수' })
	total!: number

	@ApiProperty({ description: '현재 페이지' })
	page!: number

	@ApiProperty({ description: '페이지당 항목 수' })
	limit!: number
}

// ────────────────────────────────────────────────────────────────────────────
// 스크랩 목록 응답 DTO
// ────────────────────────────────────────────────────────────────────────────
export class ScrapItemDto {
	@ApiProperty({ description: '스크랩 ID' })
	id!: number

	@ApiProperty({ description: '게시글 ID' })
	postId!: number

	@ApiProperty({ description: '게시글 제목' })
	title!: string

	@ApiProperty({ description: '게시글 내용 미리보기' })
	content!: string

	@ApiProperty({ description: '게시글 타입' })
	postType!: string

	@ApiProperty({ description: '카테고리', required: false })
	category?: string

	@ApiProperty({ description: '작성자 정보' })
	author!: {
		id: number
		name: string
		avatarUrl: string | null
	}

	@ApiProperty({ description: '스크랩 생성일' })
	createdAt!: Date
}

export class ScrapListResponseDto {
	@ApiProperty({ description: '스크랩 목록', type: [ScrapItemDto] })
	scraps!: ScrapItemDto[]

	@ApiProperty({ description: '전체 개수' })
	total!: number

	@ApiProperty({ description: '현재 페이지' })
	page!: number

	@ApiProperty({ description: '페이지당 항목 수' })
	limit!: number
}

// ────────────────────────────────────────────────────────────────────────────
// 내가 쓴 글 목록 응답 DTO
// ────────────────────────────────────────────────────────────────────────────
export class MyPostItemDto {
	@ApiProperty({ description: '게시글 ID' })
	id!: number

	@ApiProperty({ description: '제목' })
	title!: string

	@ApiProperty({ description: '내용 미리보기' })
	content!: string

	@ApiProperty({ description: '게시글 타입' })
	postType!: string

	@ApiProperty({ description: '카테고리', required: false })
	category?: string

	@ApiProperty({ description: '상태' })
	status!: string

	@ApiProperty({ description: '좋아요 수' })
	likeCount!: number

	@ApiProperty({ description: '댓글 수' })
	commentCount!: number

	@ApiProperty({ description: '생성일' })
	createdAt!: Date

	@ApiProperty({ description: '수정일' })
	updatedAt!: Date
}

export class MyPostListResponseDto {
	@ApiProperty({ description: '게시글 목록', type: [MyPostItemDto] })
	posts!: MyPostItemDto[]

	@ApiProperty({ description: '전체 개수' })
	total!: number

	@ApiProperty({ description: '현재 페이지' })
	page!: number

	@ApiProperty({ description: '페이지당 항목 수' })
	limit!: number
}

// ────────────────────────────────────────────────────────────────────────────
// 내가 쓴 댓글 목록 응답 DTO
// ────────────────────────────────────────────────────────────────────────────
export class MyCommentItemDto {
	@ApiProperty({ description: '댓글 ID' })
	id!: number

	@ApiProperty({ description: '댓글 내용' })
	content!: string

	@ApiProperty({ description: '게시글 정보' })
	post!: {
		id: number
		title: string
		postType: string
	}

	@ApiProperty({ description: '작성자 정보' })
	author!: {
		id: number
		name: string
		avatarUrl: string | null
	}

	@ApiProperty({ description: '생성일' })
	createdAt!: Date

	@ApiProperty({ description: '수정일' })
	updatedAt!: Date
}

export class MyCommentListResponseDto {
	@ApiProperty({ description: '댓글 목록', type: [MyCommentItemDto] })
	comments!: MyCommentItemDto[]

	@ApiProperty({ description: '전체 개수' })
	total!: number

	@ApiProperty({ description: '현재 페이지' })
	page!: number

	@ApiProperty({ description: '페이지당 항목 수' })
	limit!: number
}

// ────────────────────────────────────────────────────────────────────────────
// 사용자 프로필 및 Role 관리 DTO
// ────────────────────────────────────────────────────────────────────────────
export class UserProfileDto {
	@ApiProperty({ description: '사용자 ID' })
	id!: number

	@ApiProperty({ description: '사용자 이름' })
	name!: string

	@ApiProperty({ description: '이메일 주소' })
	email!: string

	@ApiProperty({ description: '프로필 이미지 URL', nullable: true })
	avatarUrl!: string | null

	@ApiProperty({ description: '이메일 인증 여부' })
	emailVerified!: boolean

	@ApiProperty({ description: '계정 생성일' })
	createdAt!: Date

	@ApiProperty({ description: '계정 수정일' })
	updatedAt!: Date
}

// ────────────────────────────────────────────────────────────────────────────
// 내가 만든 코스 목록 응답 DTO
// ────────────────────────────────────────────────────────────────────────────
export class MyCourseItemDto {
	@ApiProperty({ description: '코스 ID' })
	id!: string

	@ApiProperty({ description: '코스 제목' })
	title!: string

	@ApiProperty({ description: '공개 설정', enum: ['public', 'private'] })
	visibility!: string

	@ApiProperty({ description: '작성자 정보' })
	author!: {
		id: number
		name: string
		avatarUrl: string | null
	}

	@ApiProperty({ description: '생성일' })
	createdAt!: Date

	@ApiProperty({ description: '수정일' })
	updatedAt!: Date
}

export class MyCourseListResponseDto {
	@ApiProperty({ description: '코스 목록', type: [MyCourseItemDto] })
	courses!: MyCourseItemDto[]

	@ApiProperty({ description: '전체 개수' })
	total!: number

	@ApiProperty({ description: '현재 페이지' })
	page!: number

	@ApiProperty({ description: '페이지당 항목 수' })
	limit!: number
}

// ────────────────────────────────────────────────────────────────────────────
// 저장한 코스 목록 응답 DTO
// ────────────────────────────────────────────────────────────────────────────
export class SavedCourseItemDto {
	@ApiProperty({ description: '저장 ID' })
	id!: number

	@ApiProperty({ description: '코스 정보' })
	course!: {
		id: string
		title: string
		visibility: string
		author: {
			id: number
			name: string
			avatarUrl: string | null
		}
		createdAt: Date
		updatedAt: Date
	}

	@ApiProperty({ description: '저장일' })
	savedAt!: Date
}

export class SavedCourseListResponseDto {
	@ApiProperty({ description: '저장한 코스 목록', type: [SavedCourseItemDto] })
	savedCourses!: SavedCourseItemDto[]

	@ApiProperty({ description: '전체 개수' })
	total!: number

	@ApiProperty({ description: '현재 페이지' })
	page!: number

	@ApiProperty({ description: '페이지당 항목 수' })
	limit!: number
}
