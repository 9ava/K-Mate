import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../lib/i18n/i18n'

type LocaleState = { lang: string; setLang: (lng: string) => void }
let internalUpdate = false

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set, get) => ({
			// Initialize with detected language or fallback to 'en'
			lang: i18n.isInitialized ? i18n.language : (i18n.options?.fallbackLng as string) || 'en',
			setLang: (lng) => {
				if (get().lang === lng) return
				internalUpdate = true
				i18n.changeLanguage(lng).finally(() => (internalUpdate = false))
				set({ lang: lng })
			},
		}),
		{ name: 'kmate-lang' }
	)
)

// Sync store when i18next language changes
i18n.on('languageChanged', (lng: string) => {
	if (internalUpdate) return
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
