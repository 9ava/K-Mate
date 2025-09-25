import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

const BASE = import.meta.env.VITE_I18N_BASE_URL || ''
const VERSION = import.meta.env.VITE_I18N_VERSION || '1'

i18n
	.use(Backend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: 'en',
		supportedLngs: ['en', 'ko', 'zh'],
		load: 'languageOnly',
		ns: ['common'],
		defaultNS: 'common',
		debug: import.meta.env.DEV,
		interpolation: { escapeValue: true },
		backend: {
			loadPath: `${BASE || ''}/locales/{{lng}}/{{ns}}.json?v=${VERSION}`,
		},
		detection: {
			order: ['querystring', 'navigator', 'localStorage'],
			caches: ['localStorage'],
			lookupQuerystring: 'lng',
		},
		saveMissing: false,
	})

export default i18n
