// src/s3/s3.controller.ts
import { Body, Controller, Post } from '@nestjs/common'
import { S3Service } from './s3.service'

@Controller('api/s3')
export class S3Controller {
	constructor(private readonly s3: S3Service) {}

	@Post('put-url')
	async putUrl(@Body() dto: { key: string; contentType?: string }) {
		// 여기서 key 검증(로그인 사용자 전용 prefix만 허용 등) 꼭 해주세요.
		return this.s3.getPutUrl(dto.key, dto.contentType)
	}

	@Post('delete-url')
	async deleteUrl(@Body() dto: { key: string }) {
		// key 검증
		return this.s3.getDeleteUrl(dto.key)
	}

	@Post('get-url')
	async getUrl(@Body() dto: { key: string }) {
		// 필요 시에만 제공(일반 이미지는 CloudFront로 읽으세요)
		return this.s3.getGetUrl(dto.key)
	}
}
