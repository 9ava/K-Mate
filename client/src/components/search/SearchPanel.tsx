// src/components/search/SearchPanel.tsx
import { useEffect, useState } from 'react'
import { loadKakao } from '../../lib/kakao'

type Place = { id: string; name: string; lat: number; lng: number; address?: string }

export default function SearchPanel({ onPick }: { onPick: (p: Place) => void }) {
	const [q, setQ] = useState('용산공원')
	const [results, setResults] = useState<Place[]>([])

	useEffect(() => {
		loadKakao()
	}, [])

	const search = () => {
		if (!window.kakao?.maps?.services) return
		const ps = new window.kakao.maps.services.Places()
		ps.keywordSearch(
			q,
			(data: any, status: string) => {
				if (status !== window.kakao.maps.services.Status.OK) {
					setResults([])
					return
				}
				setResults(
					data.map((d: any) => ({
						id: d.id,
						name: d.place_name,
						lat: +d.y,
						lng: +d.x,
						address: d.road_address_name || d.address_name,
					}))
				)
			},
			{ size: 10 }
		)
	}

	return (
		<div className="p-3 space-y-3 border-r w-80">
			<div className="flex gap-2">
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					className="w-full input input-bordered"
					placeholder="장소 검색(영/한글)"
				/>
				<button onClick={search} className="btn btn-primary">
					검색
				</button>
			</div>
			<ul className="space-y-2">
				{results.map((r) => (
					<li key={r.id} className="flex items-center justify-between p-2 border rounded">
						<div>
							<div className="font-medium">{r.name}</div>
							<div className="text-xs text-gray-500">{r.address}</div>
						</div>
						<button className="btn btn-sm" onClick={() => onPick(r)}>
							담기
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}
