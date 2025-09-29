// Clean up conflicting language storage on app start
export function cleanupLanguageStorage() {
	// Check if kmate-lang exists and has ko-KR, reset to en
	const kmateStorage = localStorage.getItem('kmate-lang')
	if (kmateStorage) {
		try {
			const parsed = JSON.parse(kmateStorage)
			if (parsed.state?.lang === 'ko-KR') {
				// Reset to Korean (default language)
				localStorage.setItem(
					'kmate-lang',
					JSON.stringify({
						state: { lang: 'ko' },
						version: 0,
					})
				)
				// Also update i18next localStorage
				localStorage.setItem('i18nextLng', 'ko')
			} else if (parsed.state?.lang) {
				// Ensure the language is supported
				const supportedLangs = ['en', 'ko', 'zh']
				const lang = parsed.state.lang
				if (supportedLangs.includes(lang)) {
					// Sync with i18next localStorage
					localStorage.setItem('i18nextLng', lang)
				} else {
					// Unsupported language, reset to Korean (default)
					localStorage.setItem(
						'kmate-lang',
						JSON.stringify({
							state: { lang: 'ko' },
							version: 0,
						})
					)
					localStorage.setItem('i18nextLng', 'ko')
				}
			}
		} catch (e) {
			// If parsing fails, remove the item
			localStorage.removeItem('kmate-lang')
			localStorage.setItem('i18nextLng', 'ko')
		}
	}
}
