// src/components/common/LanguageSwitcher.tsx
import { useLocaleStore } from '../../store/localeStore'

export default function LanguageSwitcher() {
	const { lang, setLang } = useLocaleStore()
	return (
		<select
			className="px-2 py-1 border rounded cursor-pointer"
			value={lang}
			onChange={(e) => setLang(e.target.value)}
		>
			<option value="en">🇺🇸 English</option>
			<option value="ko">🇰🇷 한국어</option>
			<option value="zh">🇨🇳 中文</option>
		</select>
	)
}
