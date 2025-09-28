import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Hardcoded image mapping for fallback
const TREND_IMAGE_BY_ID: Record<number, string> = {
	38: 'https://s3.amazonaws.com/shecodesio-production/uploads/files/000/076/597/original/gimbap.jpg?1681263447', // Kimbap
	32: 'https://ik.imagekit.io/umhihello/Chuseok/Pages/Hanbok/hanbok-3.jpg?updatedAt=1740718178774', // Hanbok
	31: 'https://softervolumes.com/wp-content/uploads/2021/12/Dorrell-Coffee-6z4-Seoul-2.jpg', // Cafe
	30: 'https://blog.delivered.co.kr/wp-content/uploads/2025/01/featured-2025-drama.jpg', // Webtoons
	3: 'https://ychef.files.bbci.co.uk/1280x720/p0lq9155.jpg', // K-Pop
}

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
	image: string
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
}

export const useContentStore = create<State & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				trendArticles: [],

				allContent: [
					// K-Community content
					{
						id: 1,
						type: 'post',
						category: 'community',
						title: 'Photo correlations',
						content: 'Discussion about photo correlations and techniques...',
						author: 'Marta Tomaszewska',
						createdAt: '3 hours ago',
						status: 'active',
					},
					{
						id: 2,
						type: 'post',
						category: 'community',
						title: 'The only thing worse than being a GWoC is being a GWoC: Guy Without a Camera',
						content: 'Thoughts on photography and equipment...',
						author: 'ponzu',
						createdAt: '3 hours ago',
						status: 'active',
					},
					{
						id: 3,
						type: 'post',
						category: 'community',
						title: 'Lightroom - Server NAS',
						content: 'Setting up Lightroom with Network Attached Storage...',
						author: 'Tomasz Fiema',
						createdAt: '3 hours ago',
						status: 'active',
					},
					{
						id: 4,
						type: 'post',
						category: 'community',
						title: 'Community UX 개선 아이디어',
						content: '커뮤니티 사용자 경험을 개선할 수 있는 아이디어들을 공유합니다...',
						author: '지영',
						createdAt: '1 hour ago',
						status: 'active',
					},
					{
						id: 5,
						type: 'post',
						category: 'community',
						title: 'Next.js vs Vite 경험담',
						content: '두 프레임워크를 사용해본 경험을 공유합니다...',
						author: '익명',
						createdAt: '30 mins ago',
						status: 'active',
					},
					{
						id: 6,
						type: 'post',
						category: 'community',
						title: '오늘의 사진 공유해요 📸',
						content: '오늘 찍은 멋진 사진들을 공유해보세요!',
						author: '민수',
						createdAt: '10 mins ago',
						status: 'active',
					},
					// Additional community comments
					{
						id: 201,
						type: 'comment',
						category: 'community',
						content: '저도 가봤는데 정말 맛있더라구요!',
						author: 'student2@example.com',
						createdAt: '2024-01-19',
						status: 'active',
					},
					{
						id: 202,
						type: 'comment',
						category: 'community',
						content: '스터디 그룹에 참여하고 싶습니다!',
						author: 'study_enthusiast@example.com',
						createdAt: '2024-01-20',
						status: 'hidden',
					},
				],

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

							// Priority: 1) Backend order, 2) localStorage order, 3) default index
							const order = (post as any).order ?? savedOrder[post.id] ?? index

							// Use admin-uploaded image first, then fallback to hardcoded map, then default
							const finalImage = post.imageUrl ||
											  TREND_IMAGE_BY_ID[post.id] ||
											  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'

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

					// Try to save order to backend, but continue even if it fails
					try {
						const { updatePostsOrder } = await import('../../api/kbuzz')
						const postsOrder = reorderedArticles.map((article, index) => ({
							id: article.id,
							order: index,
						}))

						await updatePostsOrder(postsOrder)
						console.log('✅ Articles order saved to backend:', postsOrder)
					} catch (error) {
						console.warn('⚠️ Backend reorder API not available, using local storage:', (error as Error).message || error)

						// Fallback: Save order to localStorage for persistence across sessions
						const orderMap = reorderedArticles.reduce((acc, article) => {
							acc[article.id] = article.order
							return acc
						}, {} as Record<number, number>)

						localStorage.setItem('k-mate-trend-article-order', JSON.stringify(orderMap))
						console.log('📁 Order saved to localStorage:', orderMap)
					}
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
