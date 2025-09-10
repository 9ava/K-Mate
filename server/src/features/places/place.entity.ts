// src/features/places/place.entity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

/**
 * decimal(9,6) ↔ number 변환을 위한 변환기
 * - TypeORM이 decimal을 string으로 다루는 것을 방지하고자 사용
 */
const decimalToNumber = {
	to: (v?: number) => v,
	from: (v?: string) => (v != null ? parseFloat(v) : null),
}

/**
 * Place 엔티티
 * - Google Places API v1 기준으로 필요한 정보만 영속화
 * - place_id(googlePlaceId) 중심으로 관리
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

	@ApiProperty({ description: '장소명' })
	@Column({ type: 'varchar', length: 255 })
	name!: string

	@ApiProperty({ description: '주소', nullable: true })
	@Column({ type: 'varchar', length: 255, nullable: true })
	address!: string | null

	@ApiProperty({ description: '위도 (decimal(9,6))' })
	@Column({ type: 'decimal', precision: 9, scale: 6, transformer: decimalToNumber })
	lat!: number

	@ApiProperty({ description: '경도 (decimal(9,6))' })
	@Column({ type: 'decimal', precision: 9, scale: 6, transformer: decimalToNumber })
	lng!: number

	@ApiProperty({ description: '국제 전화번호', nullable: true })
	@Column({ type: 'varchar', length: 50, nullable: true })
	phone!: string | null

	@ApiProperty({ description: '웹사이트 URL', nullable: true })
	@Column({ type: 'varchar', length: 255, nullable: true })
	website!: string | null

	@ApiProperty({ description: 'Google Maps 공유 URL', nullable: true })
	@Column({ name: 'google_maps_url', type: 'varchar', length: 512, nullable: true })
	googleMapsUrl!: string | null

	@ApiProperty({ description: '운영시간 원문 JSON', nullable: true })
	@Column({ name: 'opening_hours_json', type: 'json', nullable: true })
	openingHoursJson!: any | null

	@ApiProperty({ description: '사진 메타(JSON 배열)', nullable: true })
	@Column({ name: 'photos_json', type: 'json', nullable: true })
	photosJson!: any[] | null

	@ApiProperty({ description: '설명(editorialSummary.text)', nullable: true })
	@Column({ type: 'text', nullable: true })
	description!: string | null

	@ApiProperty({ description: '마지막 동기화 일시', nullable: true })
	@Column({ name: 'last_synced_at', type: 'datetime', nullable: true })
	lastSyncedAt!: Date | null

	@CreateDateColumn({ name: 'created_at', type: 'datetime' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
	updatedAt!: Date
}
