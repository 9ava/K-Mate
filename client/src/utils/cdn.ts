// src/utils/cdn.ts
export function cdnUrl(key: string) {
	const cdn = import.meta.env.VITE_CDN_BASE_URL
	if (!cdn) {
		// 설정 누락 시에도 앱이 죽지 않도록 경고만 남기고 상대경로로 반환
		console.warn('[cdnUrl] VITE_CDN_BASE_URL이 비어있습니다. .env에 CDN 도메인을 설정하세요.')
		return `/${key.replace(/^\/+/, '')}`
	}
	return `${cdn.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`
}
