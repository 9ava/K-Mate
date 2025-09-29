import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ContactModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
	const { t } = useTranslation('common')
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: ''
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	if (!isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			// TODO: Implement actual contact form submission
			console.log('Contact form submitted:', formData)
			alert(t('contact.success', '문의사항이 성공적으로 전송되었습니다.'))
			setFormData({ name: '', email: '', subject: '', message: '' })
			onClose()
		} catch (error) {
			console.error('Failed to submit contact form:', error)
			alert(t('contact.error', '문의사항 전송에 실패했습니다. 다시 시도해주세요.'))
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-xl font-semibold text-gray-900">
						{t('contact.title', '문의하기')}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
							{t('contact.name', '이름')} *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder={t('contact.name_placeholder', '이름을 입력해주세요')}
						/>
					</div>

					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
							{t('contact.email', '이메일')} *
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder={t('contact.email_placeholder', '이메일을 입력해주세요')}
						/>
					</div>

					<div>
						<label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
							{t('contact.subject', '제목')} *
						</label>
						<select
							id="subject"
							name="subject"
							value={formData.subject}
							onChange={handleChange}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">{t('contact.subject_placeholder', '문의 유형을 선택해주세요')}</option>
							<option value="general">{t('contact.general', '일반 문의')}</option>
							<option value="technical">{t('contact.technical', '기술적 문제')}</option>
							<option value="feature">{t('contact.feature', '기능 제안')}</option>
							<option value="bug">{t('contact.bug', '버그 신고')}</option>
							<option value="other">{t('contact.other', '기타')}</option>
						</select>
					</div>

					<div>
						<label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
							{t('contact.message', '메시지')} *
						</label>
						<textarea
							id="message"
							name="message"
							value={formData.message}
							onChange={handleChange}
							required
							rows={5}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
							placeholder={t('contact.message_placeholder', '문의하실 내용을 자세히 작성해주세요')}
						/>
					</div>

					{/* Buttons */}
					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
						>
							{t('common.cancel', '취소')}
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting
								? t('contact.sending', '전송 중...')
								: t('contact.send', '전송하기')
							}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}