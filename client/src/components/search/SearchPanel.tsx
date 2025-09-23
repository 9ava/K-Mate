// src/components/search/SearchPanel.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchGooglePlaces, type GooglePlace } from '../../lib/googlePlaces'

type Place = { id: string; name: string; lat: number; lng: number; address?: string }

export default function SearchPanel({ onPick }: { onPick: (p: Place) => void }) {
	const { t, i18n } = useTranslation()
	const [q, setQ] = useState('강남취창업허브센터')
	const [results, setResults] = useState<GooglePlace[]>([])
	const [loading, setLoading] = useState(false)

	const search = async () => {
		if (!q.trim()) return
		
		setLoading(true)
		try {
			// Google Places API만 사용 (다국어 지원)
			const googleResults = await searchGooglePlaces(q.trim(), i18n.language)
			setResults(googleResults)
		} catch (error) {
			console.error('Search failed:', error)
			setResults([])
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="p-3 space-y-3 border-r w-80">
			<div className="flex gap-2">
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					onKeyPress={(e) => e.key === 'Enter' && search()}
					className="w-full input input-bordered"
					placeholder={t('planner.search.placeholder')}
					disabled={loading}
				/>
				<button onClick={search} className="btn btn-primary" disabled={loading}>
					{loading ? '...' : t('planner.search.button')}
				</button>
			</div>
			<ul className="space-y-2">
				{results.map((r) => (
					<li key={r.placeId} className="flex items-center justify-between p-2 border rounded">
						<div>
							<div className="font-medium">
								{r.name}
								<span className="ml-2 px-1 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
									Google
								</span>
							</div>
							<div className="text-xs text-gray-500">{r.address}</div>
						</div>
						<button 
							className="btn btn-sm" 
							onClick={() => onPick({
								id: r.placeId,
								name: r.name,
								lat: r.lat,
								lng: r.lng,
								address: r.address
							})}
						>
							{t('planner.search.add')}
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}
