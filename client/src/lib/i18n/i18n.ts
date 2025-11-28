import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// Vite가 자동으로 주입하는 base URL 사용 (vite.config.ts의 base 설정)
const BASE = import.meta.env.BASE_URL || ''
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
			// BASE_URL은 trailing slash 포함 (예: '/K-Mate/')
			loadPath: `${BASE}locales/{{lng}}/{{ns}}.json?v=${VERSION}`,
		},
		detection: {
			order: ['localStorage', 'querystring', 'navigator'],
			caches: ['localStorage'],
		},
		saveMissing: false,
	})

export default i18n
