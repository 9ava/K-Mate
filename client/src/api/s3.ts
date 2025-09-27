// src/api/s3.ts
import { api } from './client'
import { cdnUrl } from '../utils/cdn'

export type S3UploadResponse = {
	url: string
	key: string
	expiresIn: number
}

export type S3DeleteResponse = {
	url: string
	key: string
	expiresIn: number
}

export type S3GetResponse = {
	url: string
	key: string
	expiresIn: number
}

// Get presigned URL for uploading to S3
export async function getS3PutUrl(key: string, contentType?: string): Promise<S3UploadResponse> {
	const { data } = await api.post('/s3/put-url', { key, contentType })
	return data
}

// Get presigned URL for deleting from S3
export async function getS3DeleteUrl(key: string): Promise<S3DeleteResponse> {
	const { data } = await api.post('/s3/delete-url', { key })
	return data
}

// Get presigned URL for reading from S3 (for private files)
export async function getS3GetUrl(key: string): Promise<S3GetResponse> {
	const { data } = await api.post('/s3/get-url', { key })
	return data
}

// Upload file to S3 using presigned URL
export async function uploadToS3(file: File, key: string): Promise<string> {
	// Get presigned URL
	const { url } = await getS3PutUrl(key, file.type)

	// Upload file directly to S3
	const response = await fetch(url, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
		},
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error')
		throw new Error(`S3 upload failed: ${response.status} ${response.statusText} - ${errorText}`)
	}

	// 읽기는 CloudFront 경유 (버킷은 비공개 + OAC)
	return cdnUrl(key)
}

// Delete file from S3 using presigned URL
export async function deleteFromS3(key: string): Promise<void> {
	const { url } = await getS3DeleteUrl(key)

	const response = await fetch(url, {
		method: 'DELETE',
	})

	if (!response.ok) {
		throw new Error(`S3 delete failed: ${response.statusText}`)
	}
}

// Generate unique key for trend images
export function generateTrendImageKey(postId: number, fileName: string): string {
	const timestamp = Date.now()
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
	return `trends/${postId}/${timestamp}_${sanitizedFileName}`
}

// Generate unique key for community images
export function generateCommunityImageKey(userId: number, fileName: string): string {
	const timestamp = Date.now()
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
	return `community/${userId}/${timestamp}_${sanitizedFileName}`
}

// Validate image file
export function validateImageFile(file: File, maxSizeMB = 5): { isValid: boolean; error?: string } {
	const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

	if (!allowedTypes.includes(file.type)) {
		return { isValid: false, error: 'Only JPG, PNG, and WebP images are allowed' }
	}

	const maxSizeBytes = maxSizeMB * 1024 * 1024
	if (file.size > maxSizeBytes) {
		return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` }
	}

	return { isValid: true }
}

