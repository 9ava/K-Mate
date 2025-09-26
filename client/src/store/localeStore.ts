import { create } from 'zustand'
import i18n from '../lib/i18n/i18n'

type LocaleState = { lang: string; setLang: (lng: string) => void }

export const useLocaleStore = create<LocaleState>()((set, get) => ({
	// Initialize with detected language or fallback to 'en'
	lang: i18n.isInitialized ? i18n.language : (i18n.options?.fallbackLng as string) || 'en',
	setLang: (lng) => {
		if (get().lang === lng) return
		i18n.changeLanguage(lng)
		set({ lang: lng })
	},
}))

// Sync store when i18next language changes
i18n.on('languageChanged', (lng: string) => {
	const { lang } = useLocaleStore.getState()
	if (lang !== lng) useLocaleStore.setState({ lang: lng })
})

// Sync store when i18next finishes initialization
i18n.on('initialized', () => {
	const detectedLang = i18n.language
	const { lang } = useLocaleStore.getState()
	if (lang !== detectedLang) {
		useLocaleStore.setState({ lang: detectedLang })
	}
})
