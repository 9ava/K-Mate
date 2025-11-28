// src/api/client.ts
import axios from 'axios'

// Mock 모드 체크 (GitHub Pages 배포 시 true)
export const isMockMode = import.meta.env.VITE_MOCK_API === 'true'

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true, //쿠키를 포함하여 요청을 보냄
})
