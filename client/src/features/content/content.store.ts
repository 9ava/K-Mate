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
	image: string
	content: string
	aboutTitle?: string
	aboutDescription?: string
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
	addTrendArticle: (article: Omit<TrendArticle, 'id'>) => Promise<void>
	updateTrendArticle: (id: number, updates: Partial<TrendArticle>) => Promise<void>
	deleteTrendArticle: (id: number) => void
	updateContentStatus: (id: number, status: 'active' | 'hidden' | 'reported') => void
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
							image: createdPost.imageUrl || articleData.image,
							content: createdPost.content,
							aboutTitle: articleData.aboutTitle,
							aboutDescription: articleData.aboutDescription,
						}

						set((state) => ({
							trendArticles: [...state.trendArticles, newArticle],
						}))
					} catch (error) {
						console.error('Failed to create trend article:', error)
						// Fallback to local storage if API fails
						const newArticle: TrendArticle = {
							...articleData,
							id: Date.now(),
						}

						set((state) => ({
							trendArticles: [...state.trendArticles, newArticle],
						}))
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
						// Fallback to local update if API fails
						set((state) => ({
							trendArticles: state.trendArticles.map((article) =>
								article.id === id ? { ...article, ...updates } : article
							),
						}))
					}
				},

				deleteTrendArticle: (id) => {
					set((state) => ({
						trendArticles: state.trendArticles.filter((article) => article.id !== id),
					}))
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
