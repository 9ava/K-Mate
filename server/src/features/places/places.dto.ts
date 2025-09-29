// src/features/places/places.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsIn,
	IsUrl,
	IsEnum,
	IsInt,
	Min,
	IsBoolean,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

/** Nearby places query DTO */
export class NearbyQueryDto {
	@ApiProperty({ description: 'Latitude' })
	@Type(() => Number)
	@IsNotEmpty()
	lat: number

	@ApiProperty({ description: 'Longitude' })
	@Type(() => Number)
	@IsNotEmpty()
	lng: number

	@ApiPropertyOptional({ description: 'Search radius in meters', example: 1000 })
	@Type(() => Number)
	@IsOptional()
	@IsInt()
	@Min(1)
	radius?: number = 1000

	@ApiPropertyOptional({ description: 'Comma-separated types filter', example: 'travel,food' })
	@IsOptional()
	@IsString()
	types?: string
}

/** Photo query DTO */
export class PhotoQueryDto {
	@ApiProperty({ description: 'Photo name from Google Places API' })
	@IsString()
	@IsNotEmpty()
	name: string

	@ApiPropertyOptional({ description: 'Maximum height in pixels', example: 400 })
	@Type(() => Number)
	@IsOptional()
	@IsInt()
	@Min(1)
	maxHeightPx?: number
}

export class AdminAddPlaceDto {
	@ApiProperty({ description: 'Google Place ID' })
	@IsString()
	@IsNotEmpty()
	placeId: string

	@ApiPropertyOptional({ description: 'Custom name for the place' })
	@IsString()
	@IsOptional()
	name?: string

	@ApiPropertyOptional({ description: 'Custom category for the place' })
	@IsString()
	@IsOptional()
	@IsIn(['K-Travel', 'K-Food', 'K-Cafe'])
	category?: 'K-Travel' | 'K-Food' | 'K-Cafe'

	@ApiPropertyOptional({ description: 'Custom description for the place' })
	@IsString()
	@IsOptional()
	description?: string

	@ApiPropertyOptional({ description: 'Custom image URL for the place' })
	@IsUrl()
	@IsOptional()
	imageUrl?: string

	@ApiPropertyOptional({ description: 'Is advertisement place' })
	@IsBoolean()
	@IsOptional()
	isAdvertisement?: boolean
}

// ... (other DTOs)

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

/** 사용자: 새 장소 추가 요청 */
export class UserAddPlaceDto {
	@ApiProperty({ description: 'Google Place ID' })
	@IsString()
	@IsNotEmpty()
	placeId: string

	@ApiPropertyOptional({ description: 'Custom name for the place' })
	@IsOptional()
	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsString()
	name?: string

	@ApiPropertyOptional({ description: 'Custom category for the place' })
	@IsOptional()
	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsString()
	@IsIn(['K-Travel', 'K-Food', 'K-Cafe'])
	category?: 'K-Travel' | 'K-Food' | 'K-Cafe'

	@ApiPropertyOptional({ description: 'Custom description for the place' })
	@IsOptional()
	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsString()
	description?: string

	@ApiPropertyOptional({ description: 'Custom image URL for the place' })
	@IsOptional()
	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsUrl({}, { message: 'imageUrl must be a valid URL' })
	imageUrl?: string

	@ApiPropertyOptional({ description: 'Is advertisement place' })
	@IsBoolean()
	@IsOptional()
	isAdvertisement?: boolean
}

/** 관리자: 카테고리 수동 지정 */
export class SetTypeDto {
	@ApiProperty({ enum: ['travel', 'food', 'cafe'] })
	@IsEnum(['travel', 'food', 'cafe'] as const)
	type!: 'travel' | 'food' | 'cafe'
}

/** 관리자: 장소 광고 상태 토글 */
export class TogglePlaceAdvertisementDto {
	@ApiProperty({ description: 'Advertisement status' })
	@IsBoolean()
	isAdvertisement!: boolean
}

/** 관리자: 다국어 메뉴판 지원 상태 토글 */
export class ToggleMultilingualMenuDto {
	@ApiProperty({ description: 'Multilingual menu support status' })
	@IsBoolean()
	hasMultilingualMenu!: boolean
}
