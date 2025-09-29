import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	OneToMany,
} from 'typeorm'

/**
 * 사용자 권한 타입 정의
 * - user: 일반 사용자 (기본값)
 * - admin: 관리자
 */
export type UserRole = 'user' | 'admin'

/**
 * User 엔티티 - Google OAuth 2.0 최적화된 사용자 관리
 *
 * 주요 특징:
 * - Google OAuth 2.0을 통한 사용자 인증 및 기본 정보 관리
 * - 내부 ID와 Google ID를 분리하여 성능 최적화 및 확장성 확보
 * - 사용자와 관리자 권한 구분으로 기본적인 권한 제어
 * - 프로필 이미지 관리 지원
 */
@Entity({ name: 'users' })
export class User {
	/**
	 * 기본키: 사용자 고유 식별자 (자동 증가)
	 * 용도: 데이터베이스 내부에서 사용자 식별, 다른 테이블에서 외래키로 참조
	 * 타입: BIGINT UNSIGNED (큰 정수, 음수 불가) - 성능 최적화를 위해 정수형 사용
	 */
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'id' })
	id!: number

	/**
	 * Google OAuth 2.0 고유 식별자
	 * 용도: Google 로그인 시 사용자 식별, Google OAuth 2.0의 'sub' 필드 저장
	 * 특징: UNIQUE 제약조건으로 중복 방지, Google 계정과 1:1 매핑 보장
	 */
	@Index({ unique: true })
	@Column({ type: 'varchar', length: 64, name: 'google_sub', nullable: false, unique: true })
	google_sub!: string

	/**
	 * 사용자 이메일 주소
	 * 용도: 사용자 식별 및 연락처, Google에서 제공하는 이메일 주소
	 * 특징: UNIQUE 제약조건 없음 (Google 계정 이메일 변경 가능성 고려)
	 */
	@Column({ type: 'varchar', length: 255, name: 'email', nullable: false })
	email!: string

	/**
	 * 이메일 인증 여부
	 * 용도: Google OAuth 2.0에서 제공하는 이메일 인증 상태
	 * 특징: TINYINT(1) - 0 또는 1 값, 기본값 0
	 */
	@Column({ type: 'tinyint', width: 1, name: 'email_verified', nullable: false, default: 0 })
	email_verified!: number

	/**
	 * 사용자 이름
	 * 용도: 화면에 표시되는 사용자 이름, Google 프로필에서 가져옴
	 * 제한: 최대 100자
	 */
	@Column({ type: 'varchar', length: 100, name: 'name', nullable: false })
	name!: string

	/**
	 * 프로필 이미지 URL
	 * 용도: 사용자 아바타 이미지, Google 프로필 이미지 URL 저장
	 * 특징: 선택사항 (NULL 허용), 최대 512자
	 */
	@Column({ type: 'varchar', length: 512, name: 'avatar_url', nullable: true })
	avatar_url!: string | null

	/**
	 * 사용자 권한
	 * 용도: 사용자와 관리자 권한 구분
	 * 값: 'user' (일반 사용자), 'admin' (관리자)
	 * 기본값: 'user' (일반 사용자로 기본 설정)
	 */
	@Column({
		type: 'enum',
		enum: ['user', 'admin'],
		name: 'role',
		nullable: false,
		default: 'user',
	})
	role!: UserRole

	/**
	 * 계정 생성일시
	 * 용도: 사용자 가입 날짜와 시간 기록
	 * 특징: 자동으로 현재 시간 설정
	 */
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	created_at!: Date

	/**
	 * 계정 수정일시
	 * 용도: 사용자 정보 수정 시 자동으로 업데이트
	 * 특징: 레코드 수정 시마다 자동으로 현재 시간으로 업데이트
	 */
	@UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
	updated_at!: Date
}
