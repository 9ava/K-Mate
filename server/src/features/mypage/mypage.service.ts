// src/features/mypage/mypage.service.ts - 마이페이지 서비스
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { PlaceBookmark } from '../places/place-bookmark.entity'
import { Interaction } from '../interactions/interaction.entity'
import { Post } from '../posts/post.entity'
import { Comment } from '../comments/comment.entity'
import { Course } from '../courses/course.entity'
import { SavedCourse } from '../courses/saved-course.entity'
import {
	UserActivityStatsDto,
	PaginationQueryDto,
	BookmarkListResponseDto,
	ScrapListResponseDto,
	MyPostListResponseDto,
	MyCommentListResponseDto,
	UserProfileDto,
	MyCourseListResponseDto,
	SavedCourseListResponseDto,
} from './mypage.dto'

@Injectable()
export class MypageService {
	constructor(
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(PlaceBookmark) private readonly bookmarkRepo: Repository<PlaceBookmark>,
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
		@InjectRepository(Course) private readonly courseRepo: Repository<Course>,
		@InjectRepository(SavedCourse) private readonly savedCourseRepo: Repository<SavedCourse>
	) {}

	/**
	 * 사용자 활동 통계 조회
	 */
	async getUserActivityStats(userId: number): Promise<UserActivityStatsDto> {
		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 각 카테고리별 개수 조회 (안전한 병렬 처리)
		const [bookmarkCount, scrapCount, postCount, commentCount, courseCount, savedCourseCount] = await Promise.allSettled([
			// 북마크 수
			this.bookmarkRepo.count({ where: { user: { id: userId } } }),
			// 스크랩 수 (interactionType이 'scrap'인 것)
			this.interactionRepo.count({ where: { user: { id: userId }, interactionType: 'scrap' } }),
			// 작성한 게시글 수
			this.postRepo.count({ where: { author: { id: userId } } }),
			// 작성한 댓글 수
			this.commentRepo.count({ where: { user: { id: userId } } }),
			// 작성한 코스 수 (테이블이 없을 경우 0 반환)
			this.courseRepo.count({ where: { authorId: String(userId) } }).catch(() => 0),
			// 저장한 코스 수 (테이블이 없을 경우 0 반환)
			this.savedCourseRepo.count({ where: { userId } }).catch(() => 0),
		])

		// Promise.allSettled 결과 처리
		const getCount = (result: PromiseSettledResult<number>) => 
			result.status === 'fulfilled' ? result.value : 0

		return {
			bookmarkCount: getCount(bookmarkCount),
			scrapCount: getCount(scrapCount),
			postCount: getCount(postCount),
			commentCount: getCount(commentCount),
			courseCount: getCount(courseCount),
			savedCourseCount: getCount(savedCourseCount),
		}
	}

	/**
	 * 내 북마크 목록 조회
	 */
	async getMyBookmarks(userId: number, query: PaginationQueryDto): Promise<BookmarkListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 북마크 목록 조회
		const [bookmarks, total] = await this.bookmarkRepo.findAndCount({
			where: { user: { id: userId } },
			relations: { place: true },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		return {
			bookmarks: bookmarks.map((bookmark) => ({
				id: bookmark.id,
				placeId: bookmark.place.googlePlaceId,
				name: bookmark.place.name,
				address: bookmark.place.address || '',
				lat: bookmark.place.lat,
				lng: bookmark.place.lng,
				googleMapsUrl: bookmark.place.googleMapsUrl || '',
				type: (bookmark.place as any).type,
				createdAt: bookmark.createdAt,
			})),
			total,
			page,
			limit,
		}
	}

	/**
	 * 내 스크랩 목록 조회
	 */
	async getMyScraps(userId: number, query: PaginationQueryDto): Promise<ScrapListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 스크랩 목록 조회 (interactionType이 'scrap'인 것)
		const [interactions, total] = await this.interactionRepo.findAndCount({
			where: { user: { id: userId }, interactionType: 'scrap' },
			relations: { post: { author: true } },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		return {
			scraps: interactions.map((interaction) => ({
				id: interaction.id,
				postId: interaction.post.id,
				title: interaction.post.title,
				content: interaction.post.content.substring(0, 100) + (interaction.post.content.length > 100 ? '...' : ''),
				postType: interaction.post.postType,
				category: interaction.post.category || undefined,
				author: {
					id: interaction.post.author.id,
					name: (interaction.post.author as any).name,
					avatarUrl: (interaction.post.author as any).avatar_url,
				},
				createdAt: interaction.createdAt,
			})),
			total,
			page,
			limit,
		}
	}

	/**
	 * 내가 쓴 글 목록 조회
	 */
	async getMyPosts(userId: number, query: PaginationQueryDto): Promise<MyPostListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 내가 쓴 글 목록 조회
		const [posts, total] = await this.postRepo.findAndCount({
			where: { author: { id: userId } },
			relations: { author: true },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		// 각 게시글의 좋아요 수와 댓글 수 조회
		const postsWithStats = await Promise.all(
			posts.map(async (post) => {
				const [likeCount, commentCount] = await Promise.all([
					this.interactionRepo.count({ where: { post: { id: post.id }, interactionType: 'like' } }),
					this.commentRepo.count({ where: { post: { id: post.id } } }),
				])

				return {
					id: post.id,
					title: post.title,
					content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
					postType: post.postType,
					category: post.category || undefined,
					status: post.status,
					likeCount,
					commentCount,
					createdAt: post.createdAt,
					updatedAt: post.updatedAt,
				}
			})
		)

		return {
			posts: postsWithStats,
			total,
			page,
			limit,
		}
	}

	/**
	 * 내가 쓴 댓글 목록 조회
	 */
	async getMyComments(userId: number, query: PaginationQueryDto): Promise<MyCommentListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 내가 쓴 댓글 목록 조회
		const [comments, total] = await this.commentRepo.findAndCount({
			where: { user: { id: userId } },
			relations: { post: true, user: true },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		return {
			comments: comments.map((comment) => ({
				id: comment.id,
				content: comment.content,
				post: {
					id: comment.post.id,
					title: comment.post.title,
					postType: comment.post.postType,
				},
				author: {
					id: comment.user.id,
					name: (comment.user as any).name,
					avatarUrl: (comment.user as any).avatar_url,
				},
				createdAt: comment.createdAt,
				updatedAt: comment.createdAt,
			})),
			total,
			page,
			limit,
		}
	}

	/**
	 * 사용자 프로필 및 Role 확인 (RQ-7001)
	 */
	async getUserProfile(userId: number): Promise<UserProfileDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			avatarUrl: user.avatar_url,
			emailVerified: Boolean(user.email_verified),
			createdAt: user.created_at,
			updatedAt: user.updated_at,
		}
	}

	/**
	 * 내가 만든 코스 목록 조회
	 */
	async getMyCourses(userId: number, query: PaginationQueryDto): Promise<MyCourseListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		try {
			// 내가 만든 코스 목록 조회
			const [courses, total] = await this.courseRepo.findAndCount({
				where: { authorId: String(userId) },
				relations: { author: true },
				order: { created_at: 'DESC' },
				skip,
				take: limit,
			})

			return {
				courses: courses.map((course) => ({
					id: course.id,
					title: course.title,
					visibility: course.visibility,
					author: {
						id: course.author.id,
						name: course.author.name,
						avatarUrl: course.author.avatar_url,
					},
					createdAt: course.created_at,
					updatedAt: course.updated_at,
				})),
				total,
				page,
				limit,
			}
		} catch (error) {
			// 테이블이 없거나 다른 오류가 발생한 경우 빈 결과 반환
			console.warn('코스 목록 조회 실패:', {
				error: error.message,
				stack: error.stack,
				userId,
				page,
				limit
			})
			return {
				courses: [],
				total: 0,
				page,
				limit,
			}
		}
	}

	/**
	 * 저장한 코스 목록 조회
	 */
	async getSavedCourses(userId: number, query: PaginationQueryDto): Promise<SavedCourseListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		try {
			// 저장한 코스 목록 조회
			const [savedCourses, total] = await this.savedCourseRepo.findAndCount({
				where: { userId },
				relations: { course: { author: true } },
				order: { savedAt: 'DESC' },
				skip,
				take: limit,
			})

			return {
				savedCourses: savedCourses.map((savedCourse) => ({
					id: savedCourse.id,
					course: {
						id: savedCourse.course.id,
						title: savedCourse.course.title,
						visibility: savedCourse.course.visibility,
						author: {
							id: savedCourse.course.author.id,
							name: savedCourse.course.author.name,
							avatarUrl: savedCourse.course.author.avatar_url,
						},
						createdAt: savedCourse.course.created_at,
						updatedAt: savedCourse.course.updated_at,
					},
					savedAt: savedCourse.savedAt,
				})),
				total,
				page,
				limit,
			}
		} catch (error) {
			// 테이블이 없거나 다른 오류가 발생한 경우 빈 결과 반환
			console.warn('저장한 코스 목록 조회 실패:', {
				error: error.message,
				stack: error.stack,
				userId,
				page,
				limit
			})
			return {
				savedCourses: [],
				total: 0,
				page,
				limit,
			}
		}
	}

}
