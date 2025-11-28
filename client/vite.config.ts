import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [react()],
	// GitHub Pages 배포 시 base path 설정
	// 레포지토리 이름이 K-Mate라면 '/K-Mate/'
	base: mode === 'production' ? '/K-Mate/' : '/',
}))
