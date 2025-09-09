import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
	Unique,
} from 'typeorm'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'
import { Place } from '../places/place.entity'

/**
 * 상호작용 타입 정의
 * - like: 좋아요
 * - scrap: 스크랩
 * - bookmark: 북마크
 */
export type InteractionType = 'like' | 'scrap' | 'bookmark'

/**
 * 상호작용 대상 타입 정의
 * - post: 게시글
 * - place: 장소
 */
export type TargetType = 'post' | 'place'

/**
 * Interaction 엔티티 - 상호작용 통합 관리
 * 
 * 주요 특징:
 * - 좋아요, 스크랩, 북마크를 하나의 테이블로 통합 관리
 * - 상호작용 타입과 대상 타입을 구분하여 다양한 상호작용 지원
 * - 중복 상호작용 방지 (UNIQUE 제약조건)
 * - 실시간 통계 계산을 위한 기반 데이터 제공
 */
@Entity({ name: 'interactions' })
@Unique('unique_interaction', ['user_id', 'interaction_type', 'target_type', 'target_id'])
@Index('idx_user_id', ['user_id'])
@Index('idx_target', ['target_type', 'target_id'])
@Index('idx_interaction_type', ['interaction_type'])
@Index('idx_user_interaction_type', ['user_id', 'interaction_type'])
@Index('idx_target_interaction_type', ['target_type', 'target_id', 'interaction_type'])
@Index('idx_created_at', ['created_at'])
export class Interaction {
	/**
	 * 기본키: 상호작용 고유 식별자 (자동 증가)
	 * 용도: 데이터베이스 내부에서 상호작용 식별
	 */
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'id' })
	id!: number

	/**
	 * 사용자 ID
	 * 용도: 상호작용을 한 사용자의 ID, users 테이블의 id를 참조
	 * 특징: 외래키, 상호작용과 사용자 간의 관계 설정
	 */
	@Column({ type: 'bigint', unsigned: true, name: 'user_id', nullable: false })
	user_id!: number

	/**
	 * 상호작용 타입
	 * 용도: 상호작용의 종류 구분
	 * 값: 'like' (좋아요), 'scrap' (스크랩), 'bookmark' (북마크)
	 * 특징: 필수 입력, 상호작용의 종류를 명확히 구분
	 */
	@Column({ 
		type: 'enum', 
		enum: ['like', 'scrap', 'bookmark'], 
		name: 'interaction_type', 
		nullable: false 
	})
	interaction_type!: InteractionType

	/**
	 * 대상 타입
	 * 용도: 상호작용의 대상이 되는 엔티티 타입 구분
	 * 값: 'post' (게시글), 'place' (장소)
	 * 특징: 필수 입력, 상호작용 대상을 명확히 구분
	 */
	@Column({ 
		type: 'enum', 
		enum: ['post', 'place'], 
		name: 'target_type', 
		nullable: false 
	})
	target_type!: TargetType

	/**
	 * 대상 ID
	 * 용도: 상호작용의 대상이 되는 엔티티의 ID
	 * 특징: target_type과 함께 사용하여 구체적인 대상을 식별
	 */
	@Column({ type: 'bigint', unsigned: true, name: 'target_id', nullable: false })
	target_id!: number

	/**
	 * 상호작용 생성일시
	 * 용도: 상호작용이 발생한 날짜와 시간 기록
	 * 특징: 자동으로 현재 시간 설정
	 */
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	created_at!: Date

	// ==============================================
	// 관계 설정
	// ==============================================

	/**
	 * 상호작용을 한 사용자 (N:1 관계)
	 * 용도: 상호작용과 사용자 간의 관계 설정
	 * 특징: 사용자 삭제 시 관련 상호작용도 함께 삭제 (CASCADE)
	 */
	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User

	/**
	 * 상호작용 대상 게시글 (N:1 관계, 조건부)
	 * 용도: target_type이 'post'일 때 게시글과의 관계 설정
	 * 특징: 게시글 삭제 시 관련 상호작용도 함께 삭제 (CASCADE)
	 */
	@ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'target_id' })
	post?: Post

	/**
	 * 상호작용 대상 장소 (N:1 관계, 조건부)
	 * 용도: target_type이 'place'일 때 장소와의 관계 설정
	 * 특징: 장소 삭제 시 관련 상호작용도 함께 삭제 (CASCADE)
	 */
	@ManyToOne(() => Place, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'target_id' })
	place?: Place

}
