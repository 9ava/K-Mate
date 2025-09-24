export type TipCategory = 'travel' | 'food' | 'cafe'

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
	sections: TipSection[]
	links?: TipLink[]
	locale?: 'ko' | 'en'
}
