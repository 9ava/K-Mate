import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

const VERSION = import.meta.env.VITE_I18N_VERSION || '4'

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
		debug: false,
		interpolation: { escapeValue: false },
		backend: {
			loadPath: '/locales/{{lng}}/{{ns}}.json?v=' + VERSION,
		},
		detection: {
			order: ['localStorage', 'querystring'],
			caches: ['localStorage'],
			lookupQuerystring: 'lng',
		},
		saveMissing: false,
	})


export default i18n
