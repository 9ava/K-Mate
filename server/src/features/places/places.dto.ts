// src/features/places/places.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, IsNotEmpty, IsInt, Min } from 'class-validator'
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

	@ApiPropertyOptional({ description: '타입 (예: "food,travel,cafe")' })
	@IsOptional()
	@IsString()
	types?: string
}

/** 사진 조회 쿼리 DTO (v1 photo name 그대로) */
export class PhotoQueryDto {
	@ApiProperty({
		description: 'photo 리소스 네임',
		example: 'places/ChIJlYV9vpWifDURw8qj3W5-2qI/photos/AbCdEfGh...',
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

/** 관리자 수동 추가 바디/쿼리 DTO */
export class AdminAddPlaceDto {
	@ApiProperty({ description: 'Google Place ID', example: 'ChIJlYV9vpWifDURw8qj3W5-2qI' })
	@IsString()
	@IsNotEmpty()
	placeId!: string
}
