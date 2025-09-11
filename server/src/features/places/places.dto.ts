// src/features/places/places.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'

/** 주변검색 쿼리 DTO */
export class NearbyQueryDto {
	@ApiProperty({ description: '위도', example: 37.5665 })
	@Type(() => Number)
	@IsNumber()
	lat!: number

	@ApiProperty({ description: '경도', example: 126.978 })
	@Type(() => Number)
	@IsNumber()
	lng!: number

	@ApiPropertyOptional({ description: '반경(m)', example: 2000 })
	@Type(() => Number)
	@IsOptional()
	@IsInt()
	@Min(1)
	radius?: number

	@ApiPropertyOptional({ description: 'CSV 타입(예: "tourist_attraction,restaurant,cafe")' })
	@IsOptional()
	@IsString()
	types?: string
}

/** 사진 조회 쿼리 DTO (v1 photo name 그대로) */
export class PhotoQueryDto {
	@ApiProperty({
		description: 'photo 리소스 네임',
		example: 'places/ChIJ.../photos/AbCdEf...',
	})
	@IsString()
	@IsNotEmpty()
	name!: string

	@ApiPropertyOptional({ description: '최대 높이(px)', example: 800 })
	@Type(() => Number)
	@IsOptional()
	@IsInt()
	@Min(1)
	maxHeightPx?: number
}

/** 관리자: placeId 수동 등록/갱신 */
export class AdminAddPlaceDto {
	@ApiProperty({ description: 'Google Place ID', example: 'ChIJlYV9vpWifDUR...' })
	@IsString()
	@IsNotEmpty()
	placeId!: string
}

/** 목록 조회(필터/검색/페이지네이션) */
export class ListQueryDto {
	@ApiPropertyOptional({ enum: ['travel', 'food', 'cafe'], description: '카테고리 필터' })
	@IsOptional()
	@IsEnum(['travel', 'food', 'cafe'] as const)
	type?: 'travel' | 'food' | 'cafe'

	@ApiPropertyOptional({ description: '이름/주소 검색', example: 'seoul' })
	@IsOptional()
	@IsString()
	q?: string

	@ApiPropertyOptional({ example: 1 })
	@Type(() => Number)
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number = 1

	@ApiPropertyOptional({ example: 20 })
	@Type(() => Number)
	@IsOptional()
	@IsInt()
	@Min(1)
	pageSize?: number = 20
}

/** 관리자: 카테고리 수동 지정 */
export class SetTypeDto {
	@ApiProperty({ enum: ['travel', 'food', 'cafe'] })
	@IsEnum(['travel', 'food', 'cafe'] as const)
	type!: 'travel' | 'food' | 'cafe'
}
