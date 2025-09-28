import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { useContentStore } from '../features/content/content.store'
import { uploadToS3, generateTrendImageKey, validateImageFile } from '../api/s3'
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function ConnectPage() {
	const { refresh, ready, isAuthed } = useAuth()
	const [activeTab, setActiveTab] = useState<'trend' | 'community'>('trend')
	const [filter, setFilter] = useState<'all' | 'posts' | 'comments'>('all')
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'reported'>('all')
	const [trendLoading, setTrendLoading] = useState(false)
	const railRef = useRef<HTMLDivElement>(null)

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [editingArticle, setEditingArticle] = useState<any>(null)
	const [editDraft, setEditDraft] = useState({
		title: '',
		author: '',
		image: '',
		content: '',
		aboutTitle: '',
		aboutDescription: '',
	})

	// Create modal state
	const [createModalOpen, setCreateModalOpen] = useState(false)
	const [createDraft, setCreateDraft] = useState({
		title: '',
		author: '',
		image: '',
		content: '',
		aboutTitle: '',
		aboutDescription: '',
	})

	// S3 upload state for create modal
	const [createImageFile, setCreateImageFile] = useState<File | null>(null)
	const [createImagePreview, setCreateImagePreview] = useState<string | null>(null)
	const [createUploading, setCreateUploading] = useState(false)

	// S3 upload state for edit modal
	const [editImageFile, setEditImageFile] = useState<File | null>(null)
	const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
	const [editUploading, setEditUploading] = useState(false)

	// Use shared content store
	const {
		allContent,
		trendArticles,
		updateContentStatus,
		deleteContent,
		addTrendArticle,
		updateTrendArticle,
		deleteTrendArticle,
		loadTrendArticles,
		reorderTrendArticles,
	} = useContentStore()

	// Drag and drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	// Get all content from store
	const contents = allContent

	useEffect(() => {
		refresh()
		// Load real trend articles from backend
		const loadData = async () => {
			setTrendLoading(true)
			try {
				await loadTrendArticles()
			} catch (error) {
				console.error('Failed to load trend articles:', error)
			} finally {
				setTrendLoading(false)
			}
		}
		loadData()
	}, [])

	// ESC key handler for modals
	useEffect(() => {
		if (!editModalOpen && !createModalOpen) return
		const onKey = (ev: KeyboardEvent) => {
			if (ev.key === 'Escape') {
				if (editModalOpen) handleEditClose()
				if (createModalOpen) handleCreateClose()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [editModalOpen, createModalOpen])

	if (!ready) return <div className="p-6">Loading...</div>

	if (!isAuthed) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
					<p className="text-gray-600">콘텐츠 관리 페이지에 접근하려면 로그인이 필요합니다.</p>
				</div>
			</div>
		)
	}

	const filteredContents = contents.filter((content) => {
		const categoryMatch = content.category === activeTab

		const typeMatch =
			filter === 'all' ||
			(filter === 'posts' && content.type === 'post') ||
			(filter === 'comments' && content.type === 'comment')

		const statusMatch = statusFilter === 'all' || content.status === statusFilter

		return categoryMatch && typeMatch && statusMatch
	})

	const getTabStats = (category: 'trend' | 'community') => {
		const categoryContents = contents.filter((c) => c.category === category)
		return {
			total: categoryContents.length,
			active: categoryContents.filter((c) => c.status === 'active').length,
			hidden: categoryContents.filter((c) => c.status === 'hidden').length,
			reported: categoryContents.filter((c) => c.status === 'reported').length,
		}
	}

	const handleStatusChange = (id: number, newStatus: 'active' | 'hidden' | 'reported') => {
		updateContentStatus(id, newStatus)
	}

	const handleDelete = (id: number) => {
		if (confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
			deleteContent(id)
		}
	}

	const scrollByCard = (dir: 'left' | 'right') => {
		const rail = railRef.current
		if (!rail) return
		const first = rail.querySelector<HTMLElement>('[data-card]')
		const cardWidth = first ? first.offsetWidth : 240
		rail.scrollBy({
			left: dir === 'left' ? -(cardWidth + 20) : cardWidth + 20,
			behavior: 'smooth',
		})
	}

	// Edit modal handlers
	const handleEditArticle = (article: any) => {
		setEditingArticle(article)
		setEditDraft({
			title: article.title,
			author: article.author,
			image: article.image,
			content: article.content || '',
			aboutTitle: article.aboutTitle || '',
			aboutDescription: article.aboutDescription || '',
		})
		setEditModalOpen(true)
	}

	const handleEditClose = () => {
		setEditModalOpen(false)
		setEditingArticle(null)
		setEditDraft({
			title: '',
			author: '',
			image: '',
			content: '',
			aboutTitle: '',
			aboutDescription: '',
		})
		// Reset edit image upload states
		setEditImageFile(null)
		setEditImagePreview(null)
		setEditUploading(false)
	}

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingArticle || !editDraft.title.trim()) return

		try {
			// Upload image to S3 if there's a file selected but not uploaded
			let finalImageUrl = editDraft.image
			if (editImageFile && !finalImageUrl) {
				const uploadedUrl = await uploadEditImageToS3()
				if (!uploadedUrl) return // Upload failed
				finalImageUrl = uploadedUrl
			}

			await updateTrendArticle(editingArticle.id, {
				title: editDraft.title.trim(),
				author: editDraft.author.trim(),
				image: finalImageUrl || editDraft.image.trim(),
				content: editDraft.content.trim(),
				aboutTitle: editDraft.aboutTitle.trim(),
				aboutDescription: editDraft.aboutDescription.trim(),
			})

			handleEditClose()
		} catch (error) {
			console.error('Edit article failed:', error)
			alert('아티클 수정에 실패했습니다.')
		}
	}

	const handleDeleteArticle = async (article: any) => {
		if (confirm(`"${article.title}" 아티클을 삭제하시겠습니까?`)) {
			try {
				await deleteTrendArticle(article.id)
			} catch (error) {
				console.error('Delete article failed:', error)
				alert('아티클 삭제에 실패했습니다.')
			}
		}
	}

	// Create modal handlers
	const handleCreateArticle = () => {
		setCreateDraft({
			title: '',
			author: '',
			image: '',
			content: '',
			aboutTitle: 'About K-Trend',
			aboutDescription:
				"Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team.",
		})
		setCreateModalOpen(true)
	}

	const handleCreateClose = () => {
		setCreateModalOpen(false)
		setCreateDraft({
			title: '',
			author: '',
			image: '',
			content: '',
			aboutTitle: '',
			aboutDescription: '',
		})
		// Reset create image upload states
		setCreateImageFile(null)
		setCreateImagePreview(null)
		setCreateUploading(false)
	}

	const handleCreateSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!createDraft.title.trim()) return

		try {
			// Upload image to S3 if there's a file selected but not uploaded
			let finalImageUrl = createDraft.image
			if (createImageFile && !finalImageUrl) {
				const uploadedUrl = await uploadCreateImageToS3()
				if (!uploadedUrl) return // Upload failed
				finalImageUrl = uploadedUrl
			}

			await addTrendArticle({
				title: createDraft.title.trim(),
				author: createDraft.author.trim(),
				image: finalImageUrl || '',
				content: createDraft.content.trim(),
				aboutTitle: createDraft.aboutTitle.trim(),
				aboutDescription: createDraft.aboutDescription.trim(),
			})

			handleCreateClose()
		} catch (error) {
			console.error('Create article failed:', error)
			alert('아티클 생성에 실패했습니다.')
		}
	}

	// Image upload helper functions
	const handleCreateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const validation = validateImageFile(file, 5)
		if (!validation.isValid) {
			alert(validation.error)
			e.target.value = ''
			return
		}

		setCreateImageFile(file)
		setCreateImagePreview(URL.createObjectURL(file))
	}

	const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const validation = validateImageFile(file, 5)
		if (!validation.isValid) {
			alert(validation.error)
			e.target.value = ''
			return
		}

		setEditImageFile(file)
		setEditImagePreview(URL.createObjectURL(file))
	}

	const uploadCreateImageToS3 = async (): Promise<string | null> => {
		if (!createImageFile) return null

		try {
			setCreateUploading(true)
			// Use a temporary ID for new articles (will be replaced when article is created)
			const tempId = Date.now()
			const key = generateTrendImageKey(tempId, createImageFile.name)
			const uploadedUrl = await uploadToS3(createImageFile, key)

			// Update image URL in draft
			setCreateDraft((prev) => ({ ...prev, image: uploadedUrl }))
			return uploadedUrl
		} catch (error) {
			console.error('Create image upload failed:', error)
			alert('이미지 업로드에 실패했습니다.')
			return null
		} finally {
			setCreateUploading(false)
		}
	}

	const uploadEditImageToS3 = async (): Promise<string | null> => {
		if (!editImageFile || !editingArticle) return null

		try {
			setEditUploading(true)
			const key = generateTrendImageKey(editingArticle.id, editImageFile.name)
			const uploadedUrl = await uploadToS3(editImageFile, key)

			// Update image URL in draft
			setEditDraft((prev) => ({ ...prev, image: uploadedUrl }))
			return uploadedUrl
		} catch (error) {
			console.error('Edit image upload failed:', error)
			alert('이미지 업로드에 실패했습니다.')
			return null
		} finally {
			setEditUploading(false)
		}
	}

	const clearCreateImage = () => {
		setCreateImageFile(null)
		setCreateImagePreview(null)
	}

	const clearEditImage = () => {
		setEditImageFile(null)
		setEditImagePreview(null)
	}

	const getStatusBadge = (status: string) => {
		const colors = {
			active: 'bg-green-100 text-green-800',
			hidden: 'bg-yellow-100 text-yellow-800',
			reported: 'bg-red-100 text-red-800',
		}
		const labels = {
			active: '활성',
			hidden: '숨김',
			reported: '신고됨',
		}
		return (
			<span
				className={`px-2 py-1 text-xs font-medium rounded-full ${
					colors[status as keyof typeof colors]
				}`}
			>
				{labels[status as keyof typeof labels]}
			</span>
		)
	}

	// Handle drag end for trend articles
	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event

		if (active.id !== over?.id) {
			const oldIndex = trendArticles.findIndex((article) => article.id === active.id)
			const newIndex = trendArticles.findIndex((article) => article.id === over?.id)

			const reorderedArticles = arrayMove(trendArticles, oldIndex, newIndex)
			try {
				await reorderTrendArticles(reorderedArticles)
			} catch (error) {
				console.error('Failed to reorder articles:', error)
				// Could show a toast notification here
			}
		}
	}

	// Sortable Article Card Component
	const SortableArticleCard = ({ article }: { article: any }) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
			id: article.id,
		})

		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		}

		return (
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				data-card
				className={`relative shrink-0 w-[240px] rounded-xl overflow-hidden shadow hover:shadow-lg transition group ${
					isDragging ? 'opacity-50 scale-105 z-50' : ''
				}`}
			>
				{/* Drag handle - top area of the card */}
				<div
					{...listeners}
					className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center h-8 cursor-grab active:cursor-grabbing"
				>
					<div className="w-8 h-1 transition-opacity rounded-full opacity-0 bg-white/50 group-hover:opacity-100" />
				</div>

				<div className="relative w-full h-40 bg-gray-200">
					<img
						src={
							article.image ||
							'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'
						}
						alt={article.title}
						className="object-cover w-full h-40"
						onError={(e) => {
							const target = e.target as HTMLImageElement
							if (
								target.src !==
								'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'
							) {
								target.src =
									'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'
							}
						}}
						onLoad={(e) => {
							const target = e.target as HTMLImageElement
							target.style.opacity = '1'
						}}
						style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
					/>
				</div>
				<div className="flex flex-col justify-end h-24 p-3 text-white bg-gradient-to-b from-gray-800 to-gray-900">
					<h4 className="text-sm font-semibold leading-snug line-clamp-2">{article.title}</h4>
					<p className="mt-1 text-xs text-gray-300">by {article.author}</p>
				</div>

				{/* 관리 버튼들 */}
				<div className="absolute transition-opacity opacity-0 top-10 right-2 group-hover:opacity-100">
					<button
						title="수정"
						onClick={() => handleEditArticle(article)}
						className="flex items-center justify-center w-8 h-8 mr-1 rounded-full bg-white/90 hover:bg-white"
					>
						<svg
							className="w-4 h-4 text-gray-700"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>
				</div>
				<div className="absolute transition-opacity opacity-0 top-10 right-12 group-hover:opacity-100">
					<button
						title="삭제"
						onClick={() => handleDeleteArticle(article)}
						className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500"
					>
						<svg
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">콘텐츠 관리</h1>
					<p className="text-gray-600">K-Buzz 게시물과 댓글을 관리하고 모니터링할 수 있습니다.</p>
				</div>

				{/* 탭 네비게이션 */}
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="flex -mb-px space-x-8">
							<button
								onClick={() => setActiveTab('trend')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'trend'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								K-Trend 아티클 관리
							</button>
							<button
								onClick={() => setActiveTab('community')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'community'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								K-Community
								<span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
									{getTabStats('community').total}
								</span>
							</button>
						</nav>
					</div>
				</div>

				{/* 필터 섹션 - K-Community에서만 표시 */}
				{activeTab === 'community' && (
					<div className="p-6 mb-6 bg-white rounded-lg shadow">
						<div className="flex flex-wrap gap-4">
							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">콘텐츠 유형</label>
								<select
									value={filter}
									onChange={(e) => setFilter(e.target.value as any)}
									className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="all">전체</option>
									<option value="posts">게시물</option>
									<option value="comments">댓글</option>
								</select>
							</div>
							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">상태</label>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value as any)}
									className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="all">전체</option>
									<option value="active">활성</option>
									<option value="hidden">숨김</option>
									<option value="reported">신고됨</option>
								</select>
							</div>
						</div>
					</div>
				)}

				{/* K-Trend 아티클 관리 섹션 - K-Trend 탭에서만 표시 */}
				{activeTab === 'trend' && (
					<div className="p-6 mb-6 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">트렌드 아티클 관리</h3>
								<p className="mt-1 text-sm text-gray-500">
									사용자에게 표시되는 트렌드 아티클을 관리합니다
								</p>
								<p className="mt-1 text-xs text-blue-600">
									💡 아티클 상단을 드래그해서 순서를 변경할 수 있습니다
								</p>
							</div>
							<button
								onClick={handleCreateArticle}
								className="px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
							>
								새 아티클 추가
							</button>
						</div>

						<div className="relative">
							<button
								aria-label="prev"
								onClick={() => scrollByCard('left')}
								className="absolute z-10 flex items-center justify-center w-10 h-10 -translate-y-1/2 rounded-full shadow left-4 top-1/2 bg-gray-200/90 hover:bg-gray-300"
							>
								‹
							</button>
							<button
								aria-label="next"
								onClick={() => scrollByCard('right')}
								className="absolute z-10 flex items-center justify-center w-10 h-10 -translate-y-1/2 rounded-full shadow right-4 top-1/2 bg-gray-200/90 hover:bg-gray-300"
							>
								›
							</button>

							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<div ref={railRef} className="overflow-x-auto no-scrollbar scroll-smooth">
									<div className="flex justify-start gap-5 pb-4">
										{trendLoading ? (
											// Loading state
											<div className="flex items-center justify-center w-full py-12">
												<div className="text-center">
													<div className="w-8 h-8 mx-auto border-b-2 border-purple-600 rounded-full animate-spin"></div>
													<p className="mt-2 text-gray-600">트렌드 아티클을 불러오는 중...</p>
												</div>
											</div>
										) : trendArticles.length === 0 ? (
											// Empty state
											<div className="flex items-center justify-center w-full py-12">
												<div className="text-center">
													<p className="text-gray-500">아직 트렌드 아티클이 없습니다.</p>
													<p className="mt-1 text-sm text-gray-400">새 아티클을 추가해보세요!</p>
												</div>
											</div>
										) : (
											// Articles list with drag and drop
											<SortableContext
												items={trendArticles.map((article) => article.id)}
												strategy={horizontalListSortingStrategy}
											>
												{trendArticles.map((article) => (
													<SortableArticleCard key={article.id} article={article} />
												))}
											</SortableContext>
										)}
									</div>
								</div>
							</DndContext>
						</div>
					</div>
				)}

				{/* 통계 카드 - K-Community에서만 표시 */}
				{activeTab === 'community' && (
					<div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">전체 콘텐츠</h3>
							<p className="text-2xl font-bold text-gray-900">{getTabStats(activeTab).total}</p>
						</div>
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">활성 콘텐츠</h3>
							<p className="text-2xl font-bold text-green-600">{getTabStats(activeTab).active}</p>
						</div>
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">숨겨진 콘텐츠</h3>
							<p className="text-2xl font-bold text-yellow-600">{getTabStats(activeTab).hidden}</p>
						</div>
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">신고된 콘텐츠</h3>
							<p className="text-2xl font-bold text-red-600">{getTabStats(activeTab).reported}</p>
						</div>
					</div>
				)}

				{/* 콘텐츠 목록 - K-Community에서만 표시 */}
				{activeTab === 'community' && (
					<div className="overflow-hidden bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-medium text-gray-900">K-Community 콘텐츠 목록</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											유형
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											제목/내용
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											작성자
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											작성일
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											상태
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											작업
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredContents.map((content) => (
										<tr key={content.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 py-1 text-xs font-medium rounded-full ${
														content.type === 'post'
															? 'bg-blue-100 text-blue-800'
															: 'bg-purple-100 text-purple-800'
													}`}
												>
													{content.type === 'post' ? '게시물' : '댓글'}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="max-w-xs">
													{content.title && (
														<div className="mb-1 text-sm font-medium text-gray-900 truncate">
															{content.title}
														</div>
													)}
													<div className="text-sm text-gray-500 truncate">{content.content}</div>
												</div>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
												{content.author}
											</td>
											<td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
												{content.createdAt}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{getStatusBadge(content.status)}
											</td>
											<td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
												<div className="flex space-x-2">
													<select
														value={content.status}
														onChange={(e) => handleStatusChange(content.id, e.target.value as any)}
														className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
													>
														<option value="active">활성</option>
														<option value="hidden">숨김</option>
														<option value="reported">신고됨</option>
													</select>
													<button
														onClick={() => handleDelete(content.id)}
														className="text-red-600 transition-colors hover:text-red-900"
													>
														삭제
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{filteredContents.length === 0 && (
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
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<h3 className="mt-2 text-sm font-medium text-gray-900">콘텐츠가 없습니다</h3>
								<p className="mt-1 text-sm text-gray-500">
									현재 필터 조건에 맞는 콘텐츠가 없습니다.
								</p>
							</div>
						)}
					</div>
				)}

				{/* Edit Modal */}
				{editModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div className="absolute inset-0 bg-black/40" onClick={handleEditClose} />
						<div className="relative z-10 w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
							<div className="flex items-center justify-between p-5 border-b">
								<h3 className="text-lg font-semibold">트렌드 아티클 수정</h3>
								<button
									onClick={handleEditClose}
									aria-label="close"
									className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
								>
									✕
								</button>
							</div>
							<div className="flex-1 p-5 overflow-y-auto">
								<form id="edit-article-form" className="space-y-4" onSubmit={handleEditSubmit}>
									<div>
										<label className="block mb-1 text-sm font-medium">제목</label>
										<input
											type="text"
											value={editDraft.title}
											onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
											placeholder="아티클 제목을 입력하세요"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
											required
										/>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">작성자</label>
										<input
											type="text"
											value={editDraft.author}
											onChange={(e) => setEditDraft((d) => ({ ...d, author: e.target.value }))}
											placeholder="작성자명을 입력하세요"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
											required
										/>
									</div>

									{/* 이미지 업로드 (S3) */}
									<div>
										<label className="block mb-1 text-sm font-medium">이미지</label>

										{/* 현재 이미지 URL 입력 */}
										<div className="mb-3">
											<input
												type="url"
												value={editDraft.image}
												onChange={(e) => setEditDraft((d) => ({ ...d, image: e.target.value }))}
												placeholder="이미지 URL을 입력하거나 파일을 업로드하세요"
												className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
											/>
										</div>

										{/* 파일 업로드 섹션 */}
										<div className="p-4 border-2 border-gray-300 border-dashed rounded-lg">
											{!editImagePreview ? (
												<div className="text-center">
													<p className="mb-2 text-sm text-gray-500">새 이미지를 S3에 업로드</p>
													<label className="inline-block px-4 py-2 text-gray-700 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
														파일 선택
														<input
															type="file"
															accept="image/png,image/jpeg,image/webp"
															onChange={handleEditImageSelect}
															className="hidden"
														/>
													</label>
													<p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP · 최대 5MB</p>
												</div>
											) : (
												<div>
													<div className="flex items-start gap-3 mb-3">
														<img
															src={editImagePreview}
															alt="선택된 이미지"
															className="object-cover w-20 h-20 border rounded"
														/>
														<div className="flex-1">
															<p className="text-sm font-medium">{editImageFile?.name}</p>
															{editImageFile && (
																<p className="text-xs text-gray-500">
																	{(editImageFile.size / 1024 / 1024).toFixed(2)} MB
																</p>
															)}
															{editDraft.image && editImageFile && (
																<p className="flex items-center gap-1 mt-1 text-xs text-green-600">
																	<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
																		<path
																			fillRule="evenodd"
																			d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
																			clipRule="evenodd"
																		/>
																	</svg>
																	업로드 완료
																</p>
															)}
														</div>
														<button
															type="button"
															onClick={clearEditImage}
															className="px-2 py-1 text-sm text-gray-600 rounded hover:bg-gray-100"
														>
															×
														</button>
													</div>

													{editImageFile && !editDraft.image && (
														<div className="flex gap-2">
															<button
																type="button"
																onClick={uploadEditImageToS3}
																disabled={editUploading}
																className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{editUploading ? (
																	<>
																		<svg
																			className="w-4 h-4 animate-spin"
																			fill="none"
																			viewBox="0 0 24 24"
																		>
																			<circle
																				className="opacity-25"
																				cx="12"
																				cy="12"
																				r="10"
																				stroke="currentColor"
																				strokeWidth="4"
																			></circle>
																			<path
																				className="opacity-75"
																				fill="currentColor"
																				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																			></path>
																		</svg>
																		업로드 중...
																	</>
																) : (
																	'S3에 업로드'
																)}
															</button>
														</div>
													)}
												</div>
											)}
										</div>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">내용</label>
										<textarea
											value={editDraft.content}
											onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))}
											rows={6}
											placeholder="아티클 내용을 입력하세요..."
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">About 섹션 제목</label>
										<input
											type="text"
											value={editDraft.aboutTitle}
											onChange={(e) => setEditDraft((d) => ({ ...d, aboutTitle: e.target.value }))}
											placeholder="About K-Trend"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">About 섹션 설명</label>
										<textarea
											value={editDraft.aboutDescription}
											onChange={(e) =>
												setEditDraft((d) => ({ ...d, aboutDescription: e.target.value }))
											}
											rows={3}
											placeholder="Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team."
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									{editDraft.image && (
										<div>
											<label className="block mb-1 text-sm font-medium">미리보기</label>
											<img
												src={editDraft.image}
												alt="미리보기"
												className="object-cover w-full h-32 border rounded-lg"
												onError={(e) => {
													const target = e.target as HTMLImageElement
													target.style.display = 'none'
												}}
											/>
										</div>
									)}
								</form>
							</div>
							<div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50">
								<button
									type="button"
									onClick={handleEditClose}
									className="px-4 py-2 border rounded-lg hover:bg-gray-50"
								>
									취소
								</button>
								<button
									type="submit"
									form="edit-article-form"
									className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={editUploading}
								>
									{editUploading && (
										<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									)}
									{editUploading ? '업로드 중...' : '수정 완료'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Create Modal */}
				{createModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div className="absolute inset-0 bg-black/40" onClick={handleCreateClose} />
						<div className="relative z-10 w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
							<div className="flex items-center justify-between p-5 border-b">
								<h3 className="text-lg font-semibold">새 트렌드 아티클 추가</h3>
								<button
									onClick={handleCreateClose}
									aria-label="close"
									className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
								>
									✕
								</button>
							</div>
							<div className="flex-1 p-5 overflow-y-auto">
								<form id="create-article-form" className="space-y-4" onSubmit={handleCreateSubmit}>
									<div>
										<label className="block mb-1 text-sm font-medium">제목</label>
										<input
											type="text"
											value={createDraft.title}
											onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
											placeholder="아티클 제목을 입력하세요"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
											required
										/>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">작성자</label>
										<input
											type="text"
											value={createDraft.author}
											onChange={(e) => setCreateDraft((d) => ({ ...d, author: e.target.value }))}
											placeholder="작성자명을 입력하세요"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
											required
										/>
									</div>

									{/* 이미지 업로드 (S3) */}
									<div>
										<label className="block mb-1 text-sm font-medium">이미지</label>

										{/* 현재 이미지 URL 입력 */}
										<div className="mb-3">
											<input
												type="url"
												value={createDraft.image}
												onChange={(e) => setCreateDraft((d) => ({ ...d, image: e.target.value }))}
												placeholder="이미지 URL을 입력하거나 파일을 업로드하세요"
												className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
											/>
										</div>

										{/* 파일 업로드 섹션 */}
										<div className="p-4 border-2 border-gray-300 border-dashed rounded-lg">
											{!createImagePreview ? (
												<div className="text-center">
													<p className="mb-2 text-sm text-gray-500">새 이미지를 S3에 업로드</p>
													<label className="inline-block px-4 py-2 text-gray-700 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
														파일 선택
														<input
															type="file"
															accept="image/png,image/jpeg,image/webp"
															onChange={handleCreateImageSelect}
															className="hidden"
														/>
													</label>
													<p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP · 최대 5MB</p>
												</div>
											) : (
												<div>
													<div className="flex items-start gap-3 mb-3">
														<img
															src={createImagePreview}
															alt="선택된 이미지"
															className="object-cover w-20 h-20 border rounded"
														/>
														<div className="flex-1">
															<p className="text-sm font-medium">{createImageFile?.name}</p>
															{createImageFile && (
																<p className="text-xs text-gray-500">
																	{(createImageFile.size / 1024 / 1024).toFixed(2)} MB
																</p>
															)}
															{createDraft.image && createImageFile && (
																<p className="flex items-center gap-1 mt-1 text-xs text-green-600">
																	<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
																		<path
																			fillRule="evenodd"
																			d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
																			clipRule="evenodd"
																		/>
																	</svg>
																	업로드 완료
																</p>
															)}
														</div>
														<button
															type="button"
															onClick={clearCreateImage}
															className="px-2 py-1 text-sm text-gray-600 rounded hover:bg-gray-100"
														>
															×
														</button>
													</div>

													{createImageFile && !createDraft.image && (
														<div className="flex gap-2">
															<button
																type="button"
																onClick={uploadCreateImageToS3}
																disabled={createUploading}
																className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{createUploading ? (
																	<>
																		<svg
																			className="w-4 h-4 animate-spin"
																			fill="none"
																			viewBox="0 0 24 24"
																		>
																			<circle
																				className="opacity-25"
																				cx="12"
																				cy="12"
																				r="10"
																				stroke="currentColor"
																				strokeWidth="4"
																			></circle>
																			<path
																				className="opacity-75"
																				fill="currentColor"
																				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																			></path>
																		</svg>
																		업로드 중...
																	</>
																) : (
																	'S3에 업로드'
																)}
															</button>
														</div>
													)}
												</div>
											)}
										</div>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">내용</label>
										<textarea
											value={createDraft.content}
											onChange={(e) => setCreateDraft((d) => ({ ...d, content: e.target.value }))}
											rows={6}
											placeholder="아티클 내용을 입력하세요..."
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">About 섹션 제목</label>
										<input
											type="text"
											value={createDraft.aboutTitle}
											onChange={(e) =>
												setCreateDraft((d) => ({ ...d, aboutTitle: e.target.value }))
											}
											placeholder="About K-Trend"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									<div>
										<label className="block mb-1 text-sm font-medium">About 섹션 설명</label>
										<textarea
											value={createDraft.aboutDescription}
											onChange={(e) =>
												setCreateDraft((d) => ({ ...d, aboutDescription: e.target.value }))
											}
											rows={3}
											placeholder="Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team."
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									{createDraft.image && (
										<div>
											<label className="block mb-1 text-sm font-medium">미리보기</label>
											<img
												src={createDraft.image}
												alt="미리보기"
												className="object-cover w-full h-32 border rounded-lg"
												onError={(e) => {
													const target = e.target as HTMLImageElement
													target.style.display = 'none'
												}}
											/>
										</div>
									)}
								</form>
							</div>
							<div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50">
								<button
									type="button"
									onClick={handleCreateClose}
									className="px-4 py-2 border rounded-lg hover:bg-gray-50"
								>
									취소
								</button>
								<button
									type="submit"
									form="create-article-form"
									className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={createUploading}
								>
									{createUploading && (
										<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									)}
									{createUploading ? '업로드 중...' : '아티클 추가'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
