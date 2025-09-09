import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	OneToMany,
	Index,
} from 'typeorm'
import { User } from '../users/user.entity'

/**
 * 게시글 타입 정의
 * - community: 커뮤니티 게시글 (일반 사용자 작성 가능)
 * - tips: 팁 게시글 (읽기 전용, 스크랩만 가능)
 */
export type PostType = 'community' | 'tips'

/**
 * 게시글 카테고리 정의 (community 게시글에만 사용)
 * - travel_tip: 여행팁
 * - food_review: 맛집리뷰
 * - cafe_review: 카페리뷰
 * - general: 일반
 */
export type PostCategory = 'travel_tip' | 'food_review' | 'cafe_review' | 'general'

/**
 * 게시글 상태 정의
 * - published: 게시
 * - draft: 임시저장
 * - hidden: 숨김
 */
export type PostStatus = 'published' | 'draft' | 'hidden'

/**
 * Post 엔티티 - 게시글 통합 관리
 * 
 * 주요 특징:
 * - 커뮤니티 게시글과 팁 게시글을 통합 관리
 * - 게시글 타입을 단순화하여 community와 tips만 지원
 * - 게시글 상태 관리 (게시/임시저장/숨김)
 * - 조회수 추적 및 실시간 통계 지원
 */
@Entity({ name: 'posts' })
@Index('idx_post_type', ['post_type'])
@Index('idx_author_id', ['author_id'])
@Index('idx_status', ['status'])
@Index('idx_category', ['category'])
@Index('idx_post_type_status', ['post_type', 'status'])
@Index('idx_author_post_type', ['author_id', 'post_type'])
export class Post {
	/**
	 * 기본키: 게시글 고유 식별자 (자동 증가)
	 * 용도: 데이터베이스 내부에서 게시글 식별, 다른 테이블에서 외래키로 참조
	 */
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'id' })
	id!: number

	/**
	 * 작성자 ID
	 * 용도: 게시글을 작성한 사용자의 ID, users 테이블의 id를 참조
	 * 특징: 외래키, 게시글과 작성자의 관계 설정
	 */
	@Column({ type: 'bigint', unsigned: true, name: 'author_id', nullable: false })
	author_id!: number

	/**
	 * 게시글 제목
	 * 용도: 게시글의 제목, 사용자에게 표시되는 제목
	 * 제한: 최대 200자, 필수 입력
	 */
	@Column({ type: 'varchar', length: 200, name: 'title', nullable: false })
	title!: string

	/**
	 * 게시글 내용
	 * 용도: 게시글의 본문 내용, 사용자가 작성한 상세 내용
	 * 타입: LONGTEXT - 매우 긴 텍스트 지원 (최대 4GB)
	 * 특징: 필수 입력, 긴 글도 저장 가능
	 */
	@Column({ type: 'longtext', name: 'content', nullable: false })
	content!: string

	/**
	 * 게시글 타입
	 * 용도: 게시글을 카테고리별로 분류
	 * 값: 'community' (커뮤니티), 'tips' (팁)
	 * 특징: 필수 입력, 게시글 분류의 기준
	 */
	@Column({ 
		type: 'enum', 
		enum: ['community', 'tips'], 
		name: 'post_type', 
		nullable: false 
	})
	post_type!: PostType

	/**
	 * 카테고리
	 * 용도: community 게시글의 세부 분류
	 * 값: 'travel_tip' (여행팁), 'food_review' (맛집리뷰), 'cafe_review' (카페리뷰), 'general' (일반)
	 * 특징: 선택사항 (NULL 허용), community 게시글에만 사용
	 */
	@Column({ 
		type: 'enum', 
		enum: ['travel_tip', 'food_review', 'cafe_review', 'general'], 
		name: 'category', 
		nullable: true 
	})
	category!: PostCategory | null

	/**
	 * 게시글 상태
	 * 용도: 게시글의 공개 상태 관리
	 * 값: 'published' (게시), 'draft' (임시저장), 'hidden' (숨김)
	 * 기본값: 'published' (게시 상태로 기본 설정)
	 */
	@Column({ 
		type: 'enum', 
		enum: ['published', 'draft', 'hidden'], 
		name: 'status', 
		nullable: false, 
		default: 'published' 
	})
	status!: PostStatus

	/**
	 * 조회수
	 * 용도: 게시글을 본 횟수, 인기도 측정 지표
	 * 기본값: 0 (조회수 0으로 시작)
	 * 특징: 게시글 조회 시마다 증가
	 */
	@Column({ type: 'int', name: 'view_count', nullable: false, default: 0 })
	view_count!: number

	/**
	 * 게시글 생성일시
	 * 용도: 게시글 작성 날짜와 시간 기록
	 * 특징: 자동으로 현재 시간 설정
	 */
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	created_at!: Date

	/**
	 * 게시글 수정일시
	 * 용도: 게시글 수정 시 자동으로 업데이트
	 * 특징: 레코드 수정 시마다 자동으로 현재 시간으로 업데이트
	 */
	@UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
	updated_at!: Date

	// ==============================================
	// 관계 설정
	// ==============================================

	/**
	 * 게시글 작성자 (N:1 관계)
	 * 용도: 게시글과 작성자 간의 관계 설정
	 * 특징: 작성자 삭제 시 관련 게시글도 함께 삭제 (CASCADE)
	 */
	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'author_id' })
	author!: User

	/**
	 * 게시글의 댓글들 (1:N 관계)
	 * 용도: 게시글과 댓글 간의 관계 설정
	 * 특징: 게시글 삭제 시 관련 댓글도 함께 삭제 (CASCADE)
	 */
	@OneToMany('Comment', 'post')
	comments!: any[]

	/**
	 * 게시글의 상호작용들 (1:N 관계)
	 * 용도: 게시글과 상호작용(좋아요, 스크랩) 간의 관계 설정
	 * 특징: 게시글 삭제 시 관련 상호작용도 함께 삭제 (CASCADE)
	 */
	@OneToMany('Interaction', 'post')
	interactions!: any[]

}
