import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMapStore } from '../../features/map/map.store'

export default function KMapManagePage() {
	const navigate = useNavigate()
	const { markers, loading, error, isApiMode, loadMarkers, toggleMarkerStatus, toggleAdvertisement, deleteMarker } = useMapStore()

	// Load markers on component mount
	useEffect(() => {
		loadMarkers()
	}, [])

	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [selectedStatus, setSelectedStatus] = useState<string>('all')
	const [searchTerm, setSearchTerm] = useState('')

	// Filter markers based on selected filters
	const filteredMarkers = markers.filter((marker) => {
		const matchesCategory = selectedCategory === 'all' || marker.category === selectedCategory
		const matchesStatus = selectedStatus === 'all' || marker.status === selectedStatus
		const matchesSearch =
			marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			marker.address.toLowerCase().includes(searchTerm.toLowerCase())

		return matchesCategory && matchesStatus && matchesSearch
	})

	const getStatusBadge = (status: string) => {
		return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
	}

	const getCategoryColor = (category: string) => {
		const colors = {
			'K-Travel': 'bg-blue-100 text-blue-800',
			'K-Food': 'bg-orange-100 text-orange-800',
			'K-Cafe': 'bg-green-100 text-green-800',
		}
		return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
	}

	const handleToggleStatus = async (id: number) => {
		await toggleMarkerStatus(id)
	}

	const handleToggleAdvertisement = async (id: number) => {
		await toggleAdvertisement(id)
	}

	const handleDeleteMarker = async (id: number) => {
		if (confirm('이 마커를 삭제하시겠습니까?')) {
			await deleteMarker(id)
		}
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				{/* Header */}
				<div className="relative mb-8">
					<div className="text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">K-Map 관리</h1>
						<p className="text-gray-600">지도 마커와 위치 정보를 관리합니다</p>
						{!isApiMode && (
							<div className="flex items-center justify-center mt-2 text-sm text-amber-600">
								<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
								오프라인 모드 - 로컬 데이터 사용 중
							</div>
						)}
						{isApiMode && (
							<div className="flex items-center justify-center mt-2 text-sm text-green-600">
								<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								온라인 모드 - MySQL 연동 중
							</div>
						)}
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
					<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
						<div>
							<label className="block mb-2 text-sm font-medium text-gray-700">검색</label>
							<input
								type="text"
								placeholder="이름 또는 주소 검색..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							/>
						</div>
						<div>
							<label className="block mb-2 text-sm font-medium text-gray-700">카테고리</label>
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								<option value="all">전체</option>
								<option value="K-Travel">K-Travel</option>
								<option value="K-Food">K-Food</option>
								<option value="K-Cafe">K-Cafe</option>
							</select>
						</div>
						<div>
							<label className="block mb-2 text-sm font-medium text-gray-700">상태</label>
							<select
								value={selectedStatus}
								onChange={(e) => setSelectedStatus(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								<option value="all">전체</option>
								<option value="active">활성</option>
								<option value="inactive">비활성</option>
							</select>
						</div>
						<div className="flex items-end">
							<div className="text-sm text-gray-500">총 {filteredMarkers.length}개 마커</div>
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
										마커 정보
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
										상태
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
								{filteredMarkers.map((marker) => (
									<tr key={marker.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center justify-center">
												{marker.imageUrl && (
													<div className="flex-shrink-0 w-12 h-12">
														<img
															className="object-cover w-12 h-12 rounded-lg"
															src={marker.imageUrl}
															alt={marker.name}
														/>
													</div>
												)}
												<div className={marker.imageUrl ? 'ml-4' : ''}>
													<div className="text-sm font-medium text-gray-900">{marker.name}</div>
													<div className="max-w-xs text-sm text-gray-500 truncate">{marker.address}</div>
													{marker.description && (
														<div className="max-w-xs mt-1 text-xs text-gray-400 truncate">
															{marker.description}
														</div>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
													marker.category
												)}`}
											>
												{marker.category}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center">
											<div>{marker.latitude.toFixed(4)}</div>
											<div>{marker.longitude.toFixed(4)}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													marker.isAdvertisement 
														? 'bg-yellow-100 text-yellow-800' 
														: 'bg-gray-100 text-gray-500'
												}`}
											>
												{marker.isAdvertisement ? '광고' : '일반'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
													marker.status
												)}`}
											>
												{marker.status === 'active' ? '활성' : '비활성'}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center">
											{marker.createdAt}
										</td>
										<td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
											<div className="flex justify-center gap-2">
												{/* Edit button - always available */}
												<button
													onClick={() => navigate(`/admin/map/edit/${marker.id}`)}
													className="px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 cursor-pointer"
												>
													수정
												</button>

												{/* Advertisement toggle button - always available */}
												<button
													onClick={() => handleToggleAdvertisement(marker.id)}
													className={`px-3 py-1 rounded-md text-xs ${
														marker.isAdvertisement
															? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
															: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
													}`}
												>
													{marker.isAdvertisement ? '광고해제' : '광고등록'}
												</button>

												{/* Delete button - always available */}
												<button
													onClick={() => handleDeleteMarker(marker.id)}
													className="px-3 py-1 text-xs text-red-700 bg-red-100 rounded-md hover:bg-red-200 cursor-pointer"
												>
													삭제
												</button>

												{!isApiMode && (
													<>
														<button
															onClick={() => handleToggleStatus(marker.id)}
															className={`px-3 py-1 rounded-md text-xs ${
																marker.status === 'active'
																	? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
																	: 'bg-green-100 text-green-700 hover:bg-green-200'
															}`}
														>
															{marker.status === 'active' ? '비활성화' : '활성화'}
														</button>
													</>
												)}
												{isApiMode && (
													<div className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-md">
														API 모드
													</div>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{filteredMarkers.length === 0 && (
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
						<h3 className="mt-2 text-sm font-medium text-gray-900">마커가 없습니다</h3>
						<p className="mt-1 text-sm text-gray-500">
							검색 조건을 변경하거나 새 마커를 추가해보세요.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
