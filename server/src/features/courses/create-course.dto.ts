import { Type } from 'class-transformer'
import {
	IsArray,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	ValidateNested,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 코스 내 개별 스톱(경유지) 생성 DTO
 * 각 스톱은 순서, 이름, 위치 정보를 포함합니다.
 */
class CreateCourseStopDto {
	@ApiProperty({
		description: '스톱의 순서 (1부터 시작)',
		example: 1,
		minimum: 1,
	})
	@IsNumber()
	order!: number

	@ApiProperty({
		description: '스톱 장소 이름',
		example: '경복궁',
		maxLength: 120,
	})
	@IsString()
	@MaxLength(120)
	name!: string

	@ApiProperty({
		description: '위도 (latitude)',
		example: 37.5796,
		type: 'number',
	})
	@IsNumber()
	lat!: number

	@ApiProperty({
		description: '경도 (longitude)',
		example: 126.977,
		type: 'number',
	})
	@IsNumber()
	lng!: number

	@ApiPropertyOptional({
		description: '외부 서비스 장소 ID (카카오, 구글 등)',
		example: '8024095',
	})
	@IsOptional()
	@IsString()
	externalId?: string

	@ApiPropertyOptional({
		description: '외부 서비스 제공자',
		example: 'kakao',
		enum: ['kakao', 'google'],
	})
	@IsOptional()
	@IsString()
	provider?: string
}

/**
 * 여행 코스 생성 DTO
 * 코스 제목, 공개 설정, 스톱 리스트를 포함합니다.
 */
export class CreateCourseDto {
	@ApiProperty({
		description: '코스 제목',
		example: '서울 궁궐 투어',
		maxLength: 150,
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(150)
	title!: string

	@ApiProperty({
		description: '코스 공개 설정',
		example: 'public',
		enum: ['public', 'private'],
	})
	@IsIn(['public', 'private'])
	visibility!: 'public' | 'private'

	@ApiProperty({
		description: '코스 경유지 목록',
		type: [CreateCourseStopDto],
		example: [
			{
				order: 1,
				name: '경복궁',
				lat: 37.5796,
				lng: 126.977,
				externalId: '8024095',
				provider: 'kakao',
			},
			{
				order: 2,
				name: '창덕궁',
				lat: 37.5794,
				lng: 126.9910,
				externalId: '8024096',
				provider: 'kakao',
			},
		],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateCourseStopDto)
	stops!: CreateCourseStopDto[]
}
