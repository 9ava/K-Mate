// src/lib/kakao.ts
declare global {
	interface Window {
		kakao: any
	}
}

export async function loadKakao(): Promise<typeof window.kakao> {
	if (window.kakao?.maps) return window.kakao
	await new Promise<void>((resolve, reject) => {
		const s = document.createElement('script')
		s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
			import.meta.env.VITE_KAKAO_JS_KEY
		}&autoload=false&libraries=services,clusterer,drawing`
		s.async = true
		s.defer = true
		s.onload = () => window.kakao.maps.load(() => resolve())
		s.onerror = () => reject(new Error('Failed to load Kakao Maps'))
		document.head.appendChild(s)
	})
	return window.kakao
}
