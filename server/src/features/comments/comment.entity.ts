import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'

/**
 * Comment 엔티티 - 댓글 시스템 관리
 * 
 * 주요 특징:
 * - 게시글에 대한 댓글 시스템 관리
 * - 게시글과 사용자 간의 상호작용을 위한 댓글 기능
 * - 계층형 구조 지원 (향후 대댓글 확장 가능)
 * - 자동 삭제: 게시글 삭제 시 관련 댓글 자동 삭제
 */
@Entity({ name: 'comments' })
@Index('idx_post_id', ['post_id'])
@Index('idx_user_id', ['user_id'])
@Index('idx_post_user', ['post_id', 'user_id'])
@Index('idx_created_at', ['created_at'])
export class Comment {
	/**
	 * 기본키: 댓글 고유 식별자 (자동 증가)
	 * 용도: 데이터베이스 내부에서 댓글 식별
	 */
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'id' })
	id!: number

	/**
	 * 게시글 ID
	 * 용도: 댓글이 달린 게시글의 ID, posts 테이블의 id를 참조
	 * 특징: 외래키, 댓글과 게시글 간의 관계 설정
	 */
	@Column({ type: 'bigint', unsigned: true, name: 'post_id', nullable: false })
	post_id!: number

	/**
	 * 댓글 작성자 ID
	 * 용도: 댓글을 작성한 사용자의 ID, users 테이블의 id를 참조
	 * 특징: 외래키, 댓글과 작성자 간의 관계 설정
	 */
	@Column({ type: 'bigint', unsigned: true, name: 'user_id', nullable: false })
	user_id!: number

	/**
	 * 댓글 내용
	 * 용도: 댓글의 텍스트 내용, 사용자가 작성한 댓글 내용
	 * 타입: TEXT - 긴 텍스트 지원
	 * 특징: 필수 입력, 댓글의 핵심 내용
	 */
	@Column({ type: 'text', name: 'content', nullable: false })
	content!: string

	/**
	 * 댓글 생성일시
	 * 용도: 댓글 작성 날짜와 시간 기록
	 * 특징: 자동으로 현재 시간 설정
	 */
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	created_at!: Date

	// ==============================================
	// 관계 설정
	// ==============================================

	/**
	 * 댓글이 달린 게시글 (N:1 관계)
	 * 용도: 댓글과 게시글 간의 관계 설정
	 * 특징: CASCADE 삭제로 게시글 삭제 시 관련 댓글도 자동 삭제
	 */
	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post!: Post

	/**
	 * 댓글 작성자 (N:1 관계)
	 * 용도: 댓글과 작성자 간의 관계 설정
	 * 특징: 사용자 삭제 시 관련 댓글도 함께 삭제 (CASCADE)
	 */
	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User

}
