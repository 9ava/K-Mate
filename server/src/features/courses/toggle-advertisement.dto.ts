import { IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 광고 설정 토글 DTO
 * 관리자가 코스의 광고 상태를 변경할 때 사용됩니다.
 */
export class ToggleAdvertisementDto {
	@ApiProperty({
		description: '광고 설정 상태',
		example: true,
	})
	@IsBoolean()
	isAdvertisement!: boolean
}