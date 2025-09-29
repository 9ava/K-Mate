// src/lib/map/googleMapsLoader.ts
import { Loader } from '@googlemaps/js-api-loader'

let loaderInstance: Loader | null = null

export const getGoogleMapsLoader = (): Loader => {
	if (!loaderInstance) {
		const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

		if (!API_KEY) {
			console.warn('VITE_GOOGLE_MAPS_API_KEY is not configured.')
		}

		loaderInstance = new Loader({
			apiKey: API_KEY ?? '',
			version: 'beta', // Use beta for AdvancedMarkerElement
			libraries: ['marker', 'places'], // Include all libraries that might be needed
			language: 'en',
			region: 'KR',
		})
	}

	return loaderInstance
}