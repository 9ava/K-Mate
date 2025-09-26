// Clean up conflicting language storage on app start
export function cleanupLanguageStorage() {
	// Remove i18next's own localStorage to avoid conflicts
	localStorage.removeItem('i18nextLng')

	// Check if kmate-lang exists and has ko-KR, reset to en
	const kmateStorage = localStorage.getItem('kmate-lang')
	if (kmateStorage) {
		try {
			const parsed = JSON.parse(kmateStorage)
			if (parsed.state?.lang === 'ko-KR') {
				// Reset to English
				localStorage.setItem(
					'kmate-lang',
					JSON.stringify({
						state: { lang: 'en' },
						version: 0,
					})
				)
			}
		} catch (e) {
			// If parsing fails, remove the item
			localStorage.removeItem('kmate-lang')
		}
	}
}
