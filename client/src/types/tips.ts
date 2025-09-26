export type TipCategory = 'transportation' | 'reservation'

export type TipSection = {
	id: string
	heading: string
	body?: string
	steps?: string[]
	notes?: string[]
}

export type TipLink = {
	label: string
	url: string
	external?: boolean
}

export type TipItem = {
	id: string
	category: TipCategory
	title: string
	summary?: string
	tags?: string[]
	updatedAt?: string
	/** 👇 목록 전용 카드에서는 비워둘 수 있도록 optional 로 변경 */
	sections?: TipSection[]
	links?: TipLink[]
	locale?: 'ko' | 'en'
}
