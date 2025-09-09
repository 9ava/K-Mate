import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	Index,
	OneToMany,
} from 'typeorm'

/**
 * 장소 타입 정의
 * - travel: 여행지
 * - food: 맛집
 * - cafe: 카페
 */
export type PlaceType = 'travel' | 'food' | 'cafe'

/**
 * Place 엔티티 - 장소 정보 관리
 * 
 * 주요 특징:
 * - 여행지, 맛집, 카페 등 실제 방문 가능한 장소 정보 관리
 * - 정밀한 좌표 정보와 상세 정보를 포함한 장소 데이터베이스
 * - Google Places API와 연동 가능한 구조
 * - 상호작용(북마크) 지원
 */
@Entity({ name: 'places' })
@Index('idx_place_type', ['type'])
@Index('idx_place_location', ['lat', 'lng'])
export class Place {
	/**
	 * 기본키: 장소 고유 식별자 (자동 증가)
	 * 용도: 데이터베이스 내부에서 장소 식별, 다른 테이블에서 외래키로 참조
	 */
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'id' })
	id!: number

	/**
	 * 장소 타입
	 * 용도: 장소를 카테고리별로 분류
	 * 값: 'travel' (여행지), 'food' (맛집), 'cafe' (카페)
	 * 특징: 필수 입력, 장소 분류의 기준
	 */
	@Column({ 
		type: 'enum', 
		enum: ['travel', 'food', 'cafe'], 
		name: 'type', 
		nullable: false 
	})
	type!: PlaceType

	/**
	 * 장소명
	 * 용도: 실제 장소의 이름, 사용자에게 표시되는 장소명
	 * 제한: 최대 255자, 필수 입력
	 */
	@Column({ type: 'varchar', length: 255, name: 'name', nullable: false })
	name!: string

	/**
	 * 장소 설명
	 * 용도: 장소에 대한 상세 설명, 사용자들이 장소를 이해하는 데 도움
	 * 특징: 선택사항 (NULL 허용), TEXT 타입으로 긴 설명 가능
	 */
	@Column({ type: 'text', name: 'description', nullable: true })
	description!: string | null

	/**
	 * 위도 (Latitude)
	 * 용도: 정밀한 위치 좌표, 지도 표시 및 거리 계산
	 * 타입: DECIMAL(9,6) - 소수점 6자리까지 저장 (약 11cm 정밀도)
	 * 특징: 필수 입력, 지리적 위치의 정확한 표현
	 */
	@Column({ 
		type: 'decimal', 
		precision: 9, 
		scale: 6, 
		name: 'lat', 
		nullable: false 
	})
	lat!: number

	/**
	 * 경도 (Longitude)
	 * 용도: 정밀한 위치 좌표, 지도 표시 및 거리 계산
	 * 타입: DECIMAL(9,6) - 소수점 6자리까지 저장 (약 11cm 정밀도)
	 * 특징: 필수 입력, 지리적 위치의 정확한 표현
	 */
	@Column({ 
		type: 'decimal', 
		precision: 9, 
		scale: 6, 
		name: 'lng', 
		nullable: false 
	})
	lng!: number

	/**
	 * 주소
	 * 용도: 장소의 실제 주소, 사용자가 찾아갈 수 있는 주소 정보
	 * 특징: 선택사항 (NULL 허용), 최대 255자
	 */
	@Column({ type: 'varchar', length: 255, name: 'address', nullable: true })
	address!: string | null

	/**
	 * 전화번호
	 * 용도: 장소의 연락처, 사용자가 문의할 수 있는 전화번호
	 * 특징: 선택사항 (NULL 허용), 최대 50자
	 */
	@Column({ type: 'varchar', length: 50, name: 'phone', nullable: true })
	phone!: string | null

	/**
	 * 웹사이트
	 * 용도: 장소의 공식 웹사이트 URL, 추가 정보 확인 가능
	 * 특징: 선택사항 (NULL 허용), 최대 255자
	 */
	@Column({ type: 'varchar', length: 255, name: 'website', nullable: true })
	website!: string | null

	/**
	 * 장소 등록일시
	 * 용도: 장소가 시스템에 등록된 날짜와 시간
	 * 특징: 자동으로 현재 시간 설정
	 */
	@CreateDateColumn({ type: 'datetime', name: 'created_at' })
	created_at!: Date

	// ==============================================
	// 관계 설정 (One-to-Many)
	// ==============================================

	/**
	 * 장소에 대한 상호작용들 (1:N 관계)
	 * 용도: 장소와 상호작용(북마크) 간의 관계 설정
	 * 특징: 장소 삭제 시 관련 상호작용도 함께 삭제 (CASCADE)
	 */
	@OneToMany('Interaction', 'place')
	interactions!: any[]

}
