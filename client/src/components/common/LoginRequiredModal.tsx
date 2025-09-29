// src/components/common/LoginRequiredModal.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginRequiredModalProps {
	isOpen: boolean
	onClose: () => void
	message?: string
	redirectToLogin?: boolean
}

export default function LoginRequiredModal({
	isOpen,
	onClose,
	message = '로그인을 해주세요',
	redirectToLogin = true,
}: LoginRequiredModalProps) {
	const navigate = useNavigate()

	const handleLoginClick = () => {
		onClose()
		if (redirectToLogin) {
			navigate('/login')
		}
	}

	// ESC key to close modal - hooks must be called before any early returns
	React.useEffect(() => {
		if (!isOpen) return
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}
		window.addEventListener('keydown', handleEscape)
		return () => window.removeEventListener('keydown', handleEscape)
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />

			{/* Modal */}
			<div className="relative z-10 w-[90vw] max-w-md rounded-2xl bg-white shadow-2xl p-6">
				{/* Icon */}
				<div className="flex justify-center mb-4">
					<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
						<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
				</div>

				{/* Message */}
				<div className="text-center mb-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">로그인이 필요합니다</h3>
					<p className="text-gray-600">{message}</p>
				</div>

				{/* Buttons */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
					>
						취소
					</button>
					<button
						onClick={handleLoginClick}
						className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
					>
						로그인하기
					</button>
				</div>
			</div>
		</div>
	)
}