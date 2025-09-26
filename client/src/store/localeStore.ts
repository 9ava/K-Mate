import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../lib/i18n/i18n'

type LocaleState = { lang: string; setLang: (lng: string) => void }
let internalUpdate = false

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set, get) => ({
			lang: 'en', // Default to English
			setLang: (lng) => {
				if (get().lang === lng) return
				internalUpdate = true
				i18n.changeLanguage(lng).finally(() => (internalUpdate = false))
				set({ lang: lng })
			},
		}),
		{
			name: 'kmate-lang',
			onRehydrateStorage: () => (state) => {
				// After rehydration, sync i18next with the stored language
				if (state?.lang && state.lang !== i18n.language) {
					i18n.changeLanguage(state.lang)
				}
			},
		}
	)
)

i18n.on('languageChanged', (lng: string) => {
	if (internalUpdate) return
	const { lang } = useLocaleStore.getState()
	if (lang !== lng) useLocaleStore.setState({ lang: lng })
})
