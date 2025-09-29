import { IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ToggleCourseVisibilityDto {
	@ApiProperty({
		description: '코스 공개 설정',
		enum: ['public', 'private'],
		example: 'public',
	})
	@IsIn(['public', 'private'])
	visibility: 'public' | 'private'
}
