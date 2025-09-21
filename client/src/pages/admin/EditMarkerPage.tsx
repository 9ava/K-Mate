import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMapStore } from '../../features/map/map.store'
import { useAuth } from '../../features/auth/useAuth'

export default function EditMarkerPage() {
	const navigate = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { markers, loading, error, updateMarker, deleteMarker, loadMarkers } = useMapStore()
	const { isAuthed, ready, refresh } = useAuth()

	const [markerData, setMarkerData] = useState({
		name: '',
		category: 'K-Travel' as 'K-Travel' | 'K-Food' | 'K-Cafe',
		description: '',
		imageUrl: '',
		status: 'active' as 'active' | 'inactive'
	})
	const [isLoading, setIsLoading] = useState(false)
	const [currentMarker, setCurrentMarker] = useState<any>(null)
	const [showDeleteModal, setShowDeleteModal] = useState(false)

	const categories: ('K-Travel' | 'K-Food' | 'K-Cafe')[] = ['K-Travel', 'K-Food', 'K-Cafe']

	// Check authentication on mount
	useEffect(() => {
		refresh()
	}, [refresh])

	// Load markers and find the current marker
	useEffect(() => {
		if (ready && isAuthed && id) {
			console.log('[EditMarker] Loading markers for ID:', id)
			loadMarkers()
		}
	}, [ready, isAuthed, id, loadMarkers])

	// Find current marker and populate form
	useEffect(() => {
		if (markers.length > 0 && id) {
			console.log('[EditMarker] Looking for marker with ID:', id, 'type:', typeof id)
			console.log('[EditMarker] Available markers:', markers.map(m => ({ id: m.id, type: typeof m.id, name: m.name })))
			console.log('[EditMarker] Total markers count:', markers.length)

			const markerId = parseInt(id)
			console.log('[EditMarker] Parsed ID:', markerId, 'type:', typeof markerId)

			// Try both numeric and string comparison
			const marker = markers.find(m => m.id === markerId || m.id === id || String(m.id) === id)

			console.log('[EditMarker] Found marker:', marker)

			if (marker) {
				setCurrentMarker(marker)
				setMarkerData({
					name: marker.name || '',
					category: marker.category || 'K-Travel',
					description: marker.description || '',
					imageUrl: marker.imageUrl || '',
					status: marker.status || 'active'
				})
			} else {
				console.error('[EditMarker] Marker not found with ID:', markerId)
				console.log('[EditMarker] Exact ID matches:')
				markers.forEach(m => {
					console.log(`  - Marker ${m.id} (${typeof m.id}) === ${markerId} (${typeof markerId})?`, m.id === markerId)
					console.log(`  - Marker ${m.id} (${typeof m.id}) === "${id}" (${typeof id})?`, String(m.id) === id)
				})
			}
		} else if (id) {
			console.log('[EditMarker] Waiting for markers... current count:', markers.length)
		}
	}, [markers, id])

	// Redirect if not authenticated
	useEffect(() => {
		if (ready && !isAuthed) {
			alert('로그인이 필요합니다.')
			navigate('/login')
		}
	}, [ready, isAuthed, navigate])

	// Show loading while checking auth
	if (!ready) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<div className="mb-4">
						<div className="w-8 h-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">인증 상태를 확인하고 있습니다...</p>
				</div>
			</div>
		)
	}

	// Show login required message if not authenticated
	if (!isAuthed) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">로그인이 필요합니다</h1>
					<p className="text-gray-600">마커를 수정하려면 로그인이 필요합니다.</p>
					<button
						onClick={() => navigate('/login')}
						className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
					>
						로그인 페이지로 이동
					</button>
				</div>
			</div>
		)
	}

	// Show loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<div className="mb-4">
						<div className="w-8 h-8 mx-auto border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">마커 정보를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	// Show error if marker not found after loading is complete
	if (!loading && markers.length > 0 && !currentMarker && id) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">마커를 찾을 수 없습니다</h1>
					<p className="text-gray-600">ID {id}에 해당하는 마커가 존재하지 않습니다.</p>
					<button
						onClick={() => navigate('/admin/map')}
						className="px-4 py-2 mt-4 text-white bg-red-600 rounded-md hover:bg-red-700"
					>
						목록으로 돌아가기
					</button>
				</div>
			</div>
		)
	}

	// Show loading while waiting for markers to load
	if (!currentMarker) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<div className="mb-4">
						<div className="w-8 h-8 mx-auto border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">마커 데이터를 준비하는 중...</p>
				</div>
			</div>
		)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!markerData.name.trim()) {
			alert('마커명을 입력해주세요.')
			return
		}

		try {
			setIsLoading(true)

			const updatedMarker = {
				...currentMarker,
				name: markerData.name,
				category: markerData.category,
				description: markerData.description,
				imageUrl: markerData.imageUrl,
				status: markerData.status
			}

			await updateMarker(currentMarker.id, updatedMarker)
			alert('마커가 성공적으로 수정되었습니다!')
			navigate('/admin/map')
		} catch (error) {
			console.error('Failed to update marker:', error)
			alert('마커 수정에 실패했습니다. 다시 시도해주세요.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!currentMarker) return

		try {
			setIsLoading(true)
			await deleteMarker(currentMarker.id)
			alert('마커가 성공적으로 삭제되었습니다!')
			navigate('/admin/map')
		} catch (error) {
			console.error('Failed to delete marker:', error)
			alert('마커 삭제에 실패했습니다. 다시 시도해주세요.')
		} finally {
			setIsLoading(false)
			setShowDeleteModal(false)
		}
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-4xl">
				{/* Header */}
				<div className="relative mb-8">
					<div className="text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">마커 수정</h1>
						<p className="text-gray-600">마커 정보를 수정합니다</p>
					</div>
					<div className="absolute top-0 right-0 flex gap-3">
						<button
							onClick={() => setShowDeleteModal(true)}
							className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
						>
							삭제
						</button>
						<button
							onClick={() => navigate('/admin/map')}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
						>
							돌아가기
						</button>
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

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Left: Form */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h2 className="mb-4 text-lg font-semibold">마커 정보 수정</h2>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">
									마커명 *
								</label>
								<input
									type="text"
									value={markerData.name}
									onChange={(e) => setMarkerData(prev => ({ ...prev, name: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
									required
								/>
							</div>

							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">
									카테고리 *
								</label>
								<select
									value={markerData.category}
									onChange={(e) => setMarkerData(prev => ({ ...prev, category: e.target.value as typeof markerData.category }))}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
								>
									{categories.map(category => (
										<option key={category} value={category}>{category}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">
									상태 *
								</label>
								<select
									value={markerData.status}
									onChange={(e) => setMarkerData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
								>
									<option value="active">활성</option>
									<option value="inactive">비활성</option>
								</select>
							</div>

							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">
									설명
								</label>
								<textarea
									value={markerData.description}
									onChange={(e) => setMarkerData(prev => ({ ...prev, description: e.target.value }))}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
									placeholder="마커에 대한 간단한 설명을 입력하세요..."
								/>
							</div>

							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">
									이미지 URL
								</label>
								<input
									type="url"
									value={markerData.imageUrl}
									onChange={(e) => setMarkerData(prev => ({ ...prev, imageUrl: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
									placeholder="https://example.com/image.jpg"
								/>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
							>
								{isLoading ? '수정 중...' : '마커 수정'}
							</button>
						</form>
					</div>

					{/* Right: Current Marker Info */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h2 className="mb-4 text-lg font-semibold">현재 마커 정보</h2>

						<div className="space-y-4">
							{currentMarker.imageUrl && (
								<div>
									<label className="block mb-2 text-sm font-medium text-gray-700">현재 이미지</label>
									<img
										src={currentMarker.imageUrl}
										alt={currentMarker.name}
										className="object-cover w-full h-48 rounded-lg"
									/>
								</div>
							)}

							<div className="p-4 bg-gray-50 rounded-md">
								<h4 className="mb-2 font-medium text-gray-900">기본 정보</h4>
								<div className="text-sm text-gray-600 space-y-1">
									<div><strong>이름:</strong> {currentMarker.name}</div>
									<div><strong>주소:</strong> {currentMarker.address}</div>
									<div><strong>카테고리:</strong> {currentMarker.category}</div>
									<div><strong>상태:</strong> {currentMarker.status === 'active' ? '활성' : '비활성'}</div>
									<div><strong>좌표:</strong> {currentMarker.latitude?.toFixed(6)}, {currentMarker.longitude?.toFixed(6)}</div>
									{currentMarker.place_id && <div><strong>Place ID:</strong> {currentMarker.place_id}</div>}
									<div><strong>생성일:</strong> {currentMarker.createdAt}</div>
								</div>
							</div>

							{markerData.imageUrl && markerData.imageUrl !== currentMarker.imageUrl && (
								<div>
									<label className="block mb-2 text-sm font-medium text-gray-700">새 이미지 미리보기</label>
									<img
										src={markerData.imageUrl}
										alt="새 이미지"
										className="object-cover w-full h-48 rounded-lg"
										onError={(e) => {
											e.currentTarget.style.display = 'none'
										}}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-gray-900">마커 삭제 확인</h3>
							<p className="mt-2 text-sm text-gray-600">
								정말로 이 마커를 삭제하시겠습니까?
							</p>
							{currentMarker && (
								<div className="p-3 mt-3 bg-gray-50 rounded-md">
									<div className="text-sm">
										<div className="font-medium text-gray-900">{currentMarker.name}</div>
										<div className="text-gray-500">{currentMarker.address}</div>
										<div className="text-gray-500">{currentMarker.category}</div>
									</div>
								</div>
							)}
							<p className="mt-3 text-sm text-red-600 font-medium">
								⚠️ 이 작업은 되돌릴 수 없습니다.
							</p>
						</div>
						<div className="flex gap-3">
							<button
								onClick={() => setShowDeleteModal(false)}
								className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
								disabled={isLoading}
							>
								취소
							</button>
							<button
								onClick={handleDelete}
								className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer disabled:bg-red-400"
								disabled={isLoading}
							>
								{isLoading ? '삭제 중...' : '삭제'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}