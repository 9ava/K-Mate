// src/s3/s3.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

@Injectable()
export class S3Service {
	private s3: S3Client
	private region: string
	private bucket: string

	constructor(private configService: ConfigService) {
		this.region = this.configService.get<string>('AWS_REGION') || 'ap-northeast-2'
		this.bucket = this.configService.get<string>('S3_BUCKET') || 'tmd-2025-team01-image'

		this.s3 = new S3Client({
			region: this.region,
			// AWS credentials are automatically loaded from environment variables or IAM role
		})
	}

	// 업로드(단일 파일) PUT 프리사인
	async getPutUrl(key: string, contentType = 'application/octet-stream') {
		const cmd = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ContentType: contentType,
			// ACL 사용 안 함(버킷 Owner enforced 권장), 메타 필요 시 Metadata: { ... }
		})
		const url = await getSignedUrl(this.s3, cmd, { expiresIn: 60 }) // 60초
		return { url, key, expiresIn: 60 }
	}

	// 삭제 프리사인
	async getDeleteUrl(key: string) {
		const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
		const url = await getSignedUrl(this.s3, cmd, { expiresIn: 60 })
		return { url, key, expiresIn: 60 }
	}

	// (선택) 비공개 읽기용 GET 프리사인 (CloudFront 대신 S3 직열람이 필요할 때만)
	async getGetUrl(key: string) {
		const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key })
		const url = await getSignedUrl(this.s3, cmd, { expiresIn: 60 })
		return { url, key, expiresIn: 60 }
	}
}
