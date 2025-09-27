// src/features/places/place.entity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * decimal(9,6) ↔ number 변환기
 * - TypeORM이 decimal을 string으로 다루지 않도록 숫자로 변환
 */
const decimalToNumber = {
	to: (v?: number) => v,
	from: (v?: string) => (v != null ? parseFloat(v) : null),
}

/**
 * Place 엔티티
 * - Google Places API v1 기반으로 필요한 정보 영속화
 * - place_id(googlePlaceId) 중심 관리
 * - 최종 카테고리(type)와 원본 구글 types(sourceTypesJson) 동시 보관
 * - typeSource: 자동 분류(auto)인지, 관리자 수동 지정(admin)인지 표시
 */
@Entity({ name: 'places' })
export class Place {
	@ApiProperty({ description: '내부 PK (BIGINT UNSIGNED, AUTO_INCREMENT)' })
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@ApiProperty({ description: 'Google Place ID (고유/영구 식별자)' })
	@Index({ unique: true })
	@Column({ name: 'google_place_id', type: 'varchar', length: 128 })
	googlePlaceId!: string

	@ApiPropertyOptional({ enum: ['travel', 'food', 'cafe'], description: '최종 카테고리(필터용)' })
	@Index()
	@Column({
		name: 'type',
		type: 'enum',
		enum: ['travel', 'food', 'cafe'],
		nullable: true,
	})
	type!: 'travel' | 'food' | 'cafe' | null

	@ApiProperty({ description: '장소명' })
	@Column({ type: 'varchar', length: 255 })
	name!: string

	@ApiPropertyOptional({ description: '주소' })
	@Column({ type: 'varchar', length: 255, nullable: true })
	address!: string | null

	@ApiProperty({ description: '위도 (decimal(9,6))' })
	@Column({ type: 'decimal', precision: 9, scale: 6, transformer: decimalToNumber })
	lat!: number

	@ApiProperty({ description: '경도 (decimal(9,6))' })
	@Column({ type: 'decimal', precision: 9, scale: 6, transformer: decimalToNumber })
	lng!: number

	@ApiProperty({ description: '광고 여부' })
	@Column({ name: 'is_advertisement', type: 'boolean', default: false })
	isAdvertisement!: boolean

	@ApiPropertyOptional({ description: '국제 전화번호' })
	@Column({ type: 'varchar', length: 50, nullable: true })
	phone!: string | null

	@ApiPropertyOptional({ description: '웹사이트 URL' })
	@Column({ type: 'varchar', length: 255, nullable: true })
	website!: string | null

	@ApiPropertyOptional({ description: 'Google Maps 공유 URL' })
	@Column({ name: 'google_maps_url', type: 'varchar', length: 512, nullable: true })
	googleMapsUrl!: string | null

	@ApiPropertyOptional({ description: '운영시간(JSON 원문)' })
	@Column({ name: 'opening_hours_json', type: 'json', nullable: true })
	openingHoursJson!: any | null

	@ApiPropertyOptional({ description: '사진 메타(JSON 배열)' })
	@Column({ name: 'photos_json', type: 'json', nullable: true })
	photosJson!: any[] | null

	@ApiPropertyOptional({ description: 'Google 원본 types(JSON 배열)' })
	@Column({ name: 'source_types_json', type: 'json', nullable: true })
	sourceTypesJson!: string[] | null

	@ApiPropertyOptional({ enum: ['auto', 'admin', 'user'], description: '카테고리 분류 출처' })
	@Column({
		name: 'type_source',
		type: 'enum',
		enum: ['auto', 'admin', 'user'],
		default: 'auto',
	})
	typeSource!: 'auto' | 'admin' | 'user'

	@ApiPropertyOptional({ description: '설명(editorialSummary.text)' })
	@Column({ type: 'text', nullable: true })
	description!: string | null

	@ApiPropertyOptional({ description: '마지막 동기화 일시' })
	@Column({ name: 'last_synced_at', type: 'datetime', nullable: true })
	lastSyncedAt!: Date | null

	@CreateDateColumn({ name: 'created_at', type: 'datetime' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
	updatedAt!: Date

}
