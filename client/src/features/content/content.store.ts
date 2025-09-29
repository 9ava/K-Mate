import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'


export interface ContentItem {
	id: number
	type: 'post' | 'comment'
	category: 'trend' | 'community'
	title?: string
	content: string
	author: string
	createdAt: string
	status: 'active' | 'hidden' | 'reported'
	replies?: number
}

export interface TrendArticle {
	id: number
	title: string
	author: string
	image: string | null
	content: string
	aboutTitle?: string
	aboutDescription?: string
	order?: number
}

type State = {
	trendArticles: TrendArticle[]
	allContent: ContentItem[]
}

type Actions = {
	addCommunityPost: (
		post: Omit<ContentItem, 'id' | 'createdAt' | 'status' | 'category' | 'replies'>
	) => void
	updateCommunityPost: (id: number, updates: Partial<ContentItem>) => void
	deleteCommunityPost: (id: number) => void
	loadTrendArticles: () => Promise<void>
	addTrendArticle: (article: Omit<TrendArticle, 'id'>) => Promise<void>
	updateTrendArticle: (id: number, updates: Partial<TrendArticle>) => Promise<void>
	deleteTrendArticle: (id: number) => Promise<void>
	reorderTrendArticles: (articles: TrendArticle[]) => void
	updateContentStatus: (id: number, status: 'active' | 'hidden' | 'reported') => void
	deleteContent: (id: number) => void
	// Trend order management for cross-device sync
	exportTrendOrder: () => string | null
	importTrendOrder: (orderJson: string) => boolean
	clearTrendOrder: () => void
}

export const useContentStore = create<State & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				trendArticles: [],

				allContent: [], // Now using real data from API instead of hardcoded content

				// Actions
				addCommunityPost: (postData) => {
					const newPost: ContentItem = {
						...postData,
						id: Date.now(),
						createdAt: 'just now',
						status: 'active',
						category: 'community',
						replies: 0,
					}

					set((state) => ({
						allContent: [newPost, ...state.allContent],
					}))
				},

				updateCommunityPost: (id, updates) => {
					set((state) => ({
						allContent: state.allContent.map((content) =>
							content.id === id && content.category === 'community'
								? { ...content, ...updates }
								: content
						),
					}))
				},

				deleteCommunityPost: (id) => {
					set((state) => ({
						allContent: state.allContent.filter(
							(content) => !(content.id === id && content.category === 'community')
						),
					}))
				},

				// Load trend articles from backend
				loadTrendArticles: async () => {
					try {
						const { fetchPosts } = await import('../../api/kbuzz')
						const response = await fetchPosts({
							postType: 'trend',
							status: 'published',
							page: 1,
							limit: 100, // Get all trend articles
						})

						// Load saved order from localStorage
						const savedOrderJson = localStorage.getItem('k-mate-trend-article-order')
						const savedOrder: Record<number, number> = savedOrderJson ? JSON.parse(savedOrderJson) : {}

						// Convert backend response to TrendArticle format
						const articles: TrendArticle[] = response.items.map((post, index) => {
							console.log('🖼️ Post image data:', {
								id: post.id,
								imageUrl: post.imageUrl,
								title: post.title,
								hasImage: !!post.imageUrl,
								imageLength: post.imageUrl?.length || 0
							})

							// Priority: 1) localStorage order, 2) Backend order, 3) default index
							// Note: Backend doesn't currently support order field, so prioritize localStorage
							const order = savedOrder[post.id] ?? (post as any).order ?? index

							// Use only the actual uploaded image, no fallback
							const finalImage = post.imageUrl

							console.log('🎨 Final image for post', post.id, ':', finalImage)

							return {
								id: post.id,
								title: post.title,
								author: post.author?.name || 'Admin',
								image: finalImage,
								content: post.content,
								aboutTitle: 'About K-Trend',
								aboutDescription: "Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team.",
								order: order,
							}
						})

						// Sort by order field - this ensures proper ordering regardless of backend response order
						articles.sort((a, b) => (a.order || 0) - (b.order || 0))

						if (Object.keys(savedOrder).length > 0) {
							console.log('📁 Applied localStorage order:', savedOrder)
						}

						set({ trendArticles: articles })
					} catch (error) {
						console.error('Failed to load trend articles:', error)
						// Keep existing articles on error
					}
				},

				// Trend articles actions
				addTrendArticle: async (articleData) => {
					try {
						// Call the backend API to create trend article
						const { createPost } = await import('../../api/kbuzz')
						const createdPost = await createPost({
							title: articleData.title,
							content: articleData.content,
							postType: 'trend',
							status: 'published',
							imageUrl: articleData.image || undefined,
						})

						// Convert backend response to TrendArticle format
						const newArticle: TrendArticle = {
							id: createdPost.id,
							title: createdPost.title,
							author: createdPost.author?.name || 'Admin',
							image: createdPost.imageUrl || articleData.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop',
							content: createdPost.content,
							aboutTitle: articleData.aboutTitle,
							aboutDescription: articleData.aboutDescription,
						}

						set((state) => ({
							trendArticles: [...state.trendArticles, newArticle],
						}))
					} catch (error) {
						console.error('Failed to create trend article:', error)
						throw error // Re-throw to show error to user
					}
				},

				updateTrendArticle: async (id, updates) => {
					try {
						// Call the backend API to update trend article
						const { updatePost } = await import('../../api/kbuzz')
						await updatePost(id, {
							title: updates.title,
							content: updates.content,
							imageUrl: updates.image || undefined,
						})

						// Update local state
						set((state) => ({
							trendArticles: state.trendArticles.map((article) =>
								article.id === id ? { ...article, ...updates } : article
							),
						}))
					} catch (error) {
						console.error('Failed to update trend article:', error)
						throw error // Re-throw to show error to user
					}
				},

				deleteTrendArticle: async (id) => {
					try {
						// Call the backend API to delete trend article
						const { deletePost } = await import('../../api/kbuzz')
						await deletePost(id)

						// Update local state
						set((state) => ({
							trendArticles: state.trendArticles.filter((article) => article.id !== id),
						}))
					} catch (error) {
						console.error('Failed to delete trend article:', error)
						throw error // Re-throw to show error to user
					}
				},

				reorderTrendArticles: async (articles) => {
					// Update order values
					const reorderedArticles = articles.map((article, index) => ({
						...article,
						order: index,
					}))

					// Update local state immediately for better UX
					set({ trendArticles: reorderedArticles })

					// Save order to localStorage for persistence across sessions and devices
					const orderMap = reorderedArticles.reduce((acc, article) => {
						acc[article.id] = article.order || 0
						return acc
					}, {} as Record<number, number>)

					localStorage.setItem('k-mate-trend-article-order', JSON.stringify(orderMap))
					console.log('📁 K-Trend order saved to localStorage:', orderMap)

					// Note: Backend reorder API is not implemented yet
					// Future enhancement: Add backend persistence for cross-device sync
					console.log('ℹ️ Order saved locally. For cross-device sync, backend order field needs to be implemented.')
				},

				updateContentStatus: (id, status) => {
					set((state) => ({
						allContent: state.allContent.map((content) =>
							content.id === id ? { ...content, status } : content
						),
					}))
				},

				deleteContent: (id: number) => {
					set((state) => ({
						allContent: state.allContent.filter((content) => content.id !== id),
					}))
				},

				// Trend article order management
				exportTrendOrder: () => {
					const orderJson = localStorage.getItem('k-mate-trend-article-order')
					if (orderJson) {
						console.log('📤 Exported K-Trend order:', orderJson)
						return orderJson
					}
					return null
				},

				importTrendOrder: (orderJson: string) => {
					try {
						const orderMap = JSON.parse(orderJson)
						localStorage.setItem('k-mate-trend-article-order', JSON.stringify(orderMap))
						console.log('📥 Imported K-Trend order:', orderMap)

						// Reload articles to apply new order
						get().loadTrendArticles()
						return true
					} catch (error) {
						console.error('❌ Failed to import K-Trend order:', error)
						return false
					}
				},

				clearTrendOrder: () => {
					localStorage.removeItem('k-mate-trend-article-order')
					console.log('🗑️ Cleared K-Trend order from localStorage')

					// Reload articles to apply default order
					get().loadTrendArticles()
				},

				// Getters
				getCommunityPosts: () =>
					get().allContent.filter(
						(content) => content.category === 'community' && content.status === 'active'
					),
				getContentByCategory: (category: 'trend' | 'community') =>
					get().allContent.filter((content) => content.category === category),
				getAllContent: () => get().allContent,
			}),
			{
				name: 'k-mate-content-store',
				partialize: (state) => ({
					allContent: state.allContent,
					trendArticles: state.trendArticles,
				}),
			}
		)
	)
)
