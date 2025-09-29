// src/components/common/LanguageSwitcher.tsx
import { useLocaleStore } from '../../store/localeStore'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
	const { lang, setLang } = useLocaleStore()
	const { t } = useTranslation()

	return (
		<select
			className="px-2 py-1 border rounded cursor-pointer"
			value={lang}
			onChange={(e) => setLang(e.target.value)}
			title={t('common.language_switcher_tooltip', 'Switch between English, Korean, and Chinese language options')}
		>
			<option value="en">🇺🇸 English</option>
			<option value="ko">🇰🇷 한국어</option>
			<option value="zh">🇨🇳 中文</option>
		</select>
	)
}
