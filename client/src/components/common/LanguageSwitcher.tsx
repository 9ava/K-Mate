// src/components/common/LanguageSwitcher.tsx
import { useLocaleStore } from '../../store/localeStore'

export default function LanguageSwitcher() {
	const { lang, setLang } = useLocaleStore()
	return (
		<select
			className="px-2 py-1 border rounded"
			value={lang}
			onChange={(e) => setLang(e.target.value)}
		>
			<option value="en">EN</option>
			<option value="ko">KO</option>
			<option value="zh">ZH</option>
		</select>
	)
}
