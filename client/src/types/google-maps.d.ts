declare global {
	interface Window {
		google: typeof google
	}
}

declare namespace google.maps {
	interface MapOptions {
		center?: LatLng | LatLngLiteral
		zoom?: number
		mapTypeControl?: boolean
		streetViewControl?: boolean
		fullscreenControl?: boolean
	}

	class Map {
		constructor(mapDiv: Element, opts?: MapOptions)
		setCenter(latlng: LatLng | LatLngLiteral): void
		setZoom(zoom: number): void
	}

	class LatLng {
		constructor(lat: number, lng: number)
		lat(): number
		lng(): number
	}

	interface LatLngLiteral {
		lat: number
		lng: number
	}

	class Marker {
		constructor(opts?: MarkerOptions)
		setMap(map: Map | null): void
		addListener(eventName: string, handler: Function): void
	}

	interface MarkerOptions {
		position?: LatLng | LatLngLiteral
		map?: Map
		title?: string
		icon?: string | Icon
	}

	interface Icon {
		url: string
		scaledSize?: Size
	}

	class Size {
		constructor(width: number, height: number)
	}

	class InfoWindow {
		constructor(opts?: InfoWindowOptions)
		open(map: Map, anchor?: Marker): void
		close(): void
	}

	interface InfoWindowOptions {
		content?: string | Element
	}

	namespace places {
		class PlacesService {
			constructor(attrContainer: Map | HTMLDivElement)
			textSearch(request: TextSearchRequest, callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void): void
		}

		interface TextSearchRequest {
			query: string
			location?: LatLng
			radius?: number
		}

		interface PlaceResult {
			place_id?: string
			name?: string
			formatted_address?: string
			geometry?: {
				location?: LatLng
			}
			types?: string[]
			photos?: any[]
			rating?: number
			business_status?: string
		}

		enum PlacesServiceStatus {
			OK = 'OK',
			ZERO_RESULTS = 'ZERO_RESULTS',
			OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
			REQUEST_DENIED = 'REQUEST_DENIED',
			INVALID_REQUEST = 'INVALID_REQUEST',
			UNKNOWN_ERROR = 'UNKNOWN_ERROR'
		}

		class Autocomplete {
			constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions)
			addListener(eventName: string, handler: Function): void
			getPlace(): PlaceResult
		}

		interface AutocompleteOptions {
			componentRestrictions?: ComponentRestrictions
			fields?: string[]
		}

		interface ComponentRestrictions {
			country?: string | string[]
		}
	}
}

export {}