import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listPlaces, toggleMultilingualMenu, toggleAdvertisement } from '../../api/places'
import type { Place, PlaceType } from '../../types/place'

export default function KMapManagePage() {
	const navigate = useNavigate()
	const [places, setPlaces] = useState<Place[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [selectedCategory, setSelectedCategory] = useState<PlaceType | 'all'>('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	// Load places on component mount
	useEffect(() => {
		loadPlaces()
	}, [selectedCategory, searchTerm, page])

	const loadPlaces = async () => {
		try {
			setLoading(true)
			setError(null)
			const response = await listPlaces({
				type: selectedCategory === 'all' ? undefined : selectedCategory,
				q: searchTerm || undefined,
				page,
				pageSize: 20
			})
			setPlaces(response.items)
			setTotalPages(response.totalPages || 1)
		} catch (err) {
			setError('장소 목록을 불러오는데 실패했습니다.')
			console.error(err)
		} finally {
			setLoading(false)
		}
	}

	const getCategoryColor = (type: PlaceType | null) => {
		const colors = {
			'travel': 'bg-blue-100 text-blue-800',
			'food': 'bg-orange-100 text-orange-800',
			'cafe': 'bg-green-100 text-green-800',
		}
		return type ? colors[type] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
	}

	const handleToggleMultilingualMenu = async (place: Place) => {
		try {
			const updatedPlace = await toggleMultilingualMenu(place.id, !place.hasMultilingualMenu)
			setPlaces(prev => prev.map(p => p.id === place.id ? updatedPlace : p))
		} catch (err) {
			setError('다국어 메뉴판 설정 변경에 실패했습니다.')
			console.error(err)
		}
	}

	const handleToggleAdvertisement = async (place: Place) => {
		try {
			const updatedPlace = await toggleAdvertisement(place.id, !place.isAdvertisement)
			setPlaces(prev => prev.map(p => p.id === place.id ? updatedPlace : p))
		} catch (err) {
			setError('광고 설정 변경에 실패했습니다.')
			console.error(err)
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		setPage(1) // Reset to first page when searching
	}

	const formatDate = (dateString?: string) => {
		if (!dateString) return '-'
		return new Date(dateString).toLocaleDateString('ko-KR')
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				{/* Header */}
				<div className="relative mb-8">
					<div className="text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">K-Map 관리</h1>
						<p className="text-gray-600">지도 장소와 다국어 메뉴판 지원을 관리합니다</p>
					</div>
					<div className="absolute top-0 right-0 flex gap-3">
						<button
							onClick={() => navigate('/admin')}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
						>
							돌아가기
						</button>
						<Link
							to="/admin/map/add"
							className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 inline-flex items-center gap-2 cursor-pointer"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							새 마커 추가
						</Link>
					</div>
				</div>

				{/* Filters */}
				<div className="p-6 mb-6 bg-white rounded-lg shadow">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<label className="block mb-2 text-sm font-medium text-gray-700">검색</label>
							<input
								type="text"
								placeholder="이름 또는 주소 검색..."
								value={searchTerm}
								onChange={handleSearchChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							/>
						</div>
						<div>
							<label className="block mb-2 text-sm font-medium text-gray-700">카테고리</label>
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value as PlaceType | 'all')}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								<option value="all">전체</option>
								<option value="travel">Travel</option>
								<option value="food">Food</option>
								<option value="cafe">Cafe</option>
							</select>
						</div>
						<div className="flex items-end">
							<div className="text-sm text-gray-500">총 {places.length}개 장소</div>
						</div>
					</div>
				</div>

				{/* Error Message */}
				{error && (
					<div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-200 rounded-lg">
						<div className="flex items-center">
							<svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							{error}
						</div>
					</div>
				)}

				{/* Loading State */}
				{loading && (
					<div className="flex items-center justify-center p-8 mb-6 bg-white rounded-lg shadow">
						<div className="flex items-center space-x-2">
							<div className="w-4 h-4 bg-red-600 rounded-full animate-bounce"></div>
							<div className="w-4 h-4 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
							<div className="w-4 h-4 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
							<span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
						</div>
					</div>
				)}

				{/* Markers Table */}
				<div className="overflow-hidden bg-white rounded-lg shadow">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										장소 정보
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										카테고리
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										위치
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										광고
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										다국어 메뉴판
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										생성일
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
										작업
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{places.map((place) => (
									<tr key={place.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center justify-center">
												{place.photoUrl && (
													<div className="flex-shrink-0 w-12 h-12">
														<img
															className="object-cover w-12 h-12 rounded-lg"
															src={place.photoUrl}
															alt={place.name}
														/>
													</div>
												)}
												<div className={place.photoUrl ? 'ml-4' : ''}>
													<div className="text-sm font-medium text-gray-900">{place.name}</div>
													<div className="max-w-xs text-sm text-gray-500 truncate">{place.address || '-'}</div>
													{place.description && (
														<div className="max-w-xs mt-1 text-xs text-gray-400 truncate">
															{place.description}
														</div>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(place.type)}`}
											>
												{place.type || '미분류'}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center">
											<div>{place.lat.toFixed(4)}</div>
											<div>{place.lng.toFixed(4)}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													place.isAdvertisement
														? 'bg-yellow-100 text-yellow-800'
														: 'bg-gray-100 text-gray-500'
												}`}
											>
												{place.isAdvertisement ? '광고' : '일반'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													place.hasMultilingualMenu
														? 'bg-purple-100 text-purple-800'
														: 'bg-gray-100 text-gray-500'
												}`}
											>
												{place.hasMultilingualMenu ? '지원' : '미지원'}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center">
											{formatDate(place.createdAt)}
										</td>
										<td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
											<div className="flex justify-center gap-1 flex-wrap">
												{/* Advertisement toggle button */}
												<button
													onClick={() => handleToggleAdvertisement(place)}
													className={`px-2 py-1 rounded-md text-xs ${
														place.isAdvertisement
															? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
															: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
													}`}
													title="광고 상태 토글"
												>
													{place.isAdvertisement ? '광고해제' : '광고설정'}
												</button>
												{/* Multilingual menu toggle button */}
												<button
													onClick={() => handleToggleMultilingualMenu(place)}
													className={`px-2 py-1 rounded-md text-xs ${
														place.hasMultilingualMenu
															? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
															: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
													}`}
													title="다국어 메뉴판 지원 토글"
												>
													{place.hasMultilingualMenu ? '메뉴해제' : '메뉴지원'}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{places.length === 0 && !loading && (
					<div className="py-12 text-center">
						<svg
							className="w-12 h-12 mx-auto text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						<h3 className="mt-2 text-sm font-medium text-gray-900">장소가 없습니다</h3>
						<p className="mt-1 text-sm text-gray-500">
							검색 조건을 변경하거나 새 장소를 추가해보세요.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
