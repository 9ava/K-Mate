// src/utils/dev-admin.ts
// DEVELOPMENT ONLY - Remove in production
import { api } from '../api/client'

/**
 * DEVELOPMENT ONLY: Promote current user to admin
 * This should only be used in development environment
 */
export async function makeMeAdmin() {
	try {
		const { data } = await api.post('/dev/make-me-admin')
		console.log('✅ Admin promotion successful:', data)
		return data
	} catch (error: any) {
		console.error('❌ Admin promotion failed:', error.response?.data || error.message)
		throw error
	}
}

/**
 * DEVELOPMENT ONLY: Check if current user is admin
 */
export async function checkAdmin() {
	try {
		const { data } = await api.post('/dev/check-admin')
		console.log('👤 Current user status:', data)
		return data
	} catch (error: any) {
		console.error('❌ Admin check failed:', error.response?.data || error.message)
		throw error
	}
}

/**
 * Add admin promotion functionality to window for easy access in development
 */
if (import.meta.env.DEV) {
	// @ts-ignore
	window.devAdmin = {
		makeMeAdmin,
		checkAdmin,
		help: () => {
			console.log(`
🔧 DEV ADMIN UTILITIES

1. Check your current status:
   await devAdmin.checkAdmin()

2. Promote yourself to admin:
   await devAdmin.makeMeAdmin()

3. After promotion, refresh the page and try adding markers!

Note: You must be logged in (via Google OAuth) first.
			`)
		}
	}
}