// K-Map Marker Factory
import type { PlaceType } from '../../types/place'

export function getIconClassByType(type: PlaceType | null): string {
	switch (type) {
		case 'travel':
			return 'fi fi-br-landmark-alt'
		case 'food':
			return 'fi fi-rr-bowl-rice'
		case 'cafe':
			return 'fi fi-sr-mug-hot-alt'
		default:
			return '' // 기타는 아이콘 없이 회색 점
	}
}

export function getClassByType(type: PlaceType | null): string {
	switch (type) {
		case 'travel':
			return 'km-pin travel'
		case 'food':
			return 'km-pin food'
		case 'cafe':
			return 'km-pin cafe'
		default:
			return 'km-pin etc'
	}
}

export function makePlaceMarkerEl(type: PlaceType | null, title?: string): HTMLElement {
	const wrap = document.createElement('div')
	wrap.setAttribute('aria-label', title ?? 'place')

	// 타입에 따른 배경 색상 결정
	let bgColor: string
	switch (type) {
		case 'travel':
			bgColor = '#1e3a8a'
			break // 진한 남색
		case 'food':
			bgColor = '#ef4444'
			break // 빨강
		case 'cafe':
			bgColor = '#f59e0b'
			break // 주황
		default:
			bgColor = '#6b7280'
			break // 회색
	}

	// 마커 모양 배경 스타일 (물방울 형태)
	wrap.style.cssText = `
    position: relative;
    width: 32px;
    height: 40px;
    cursor: pointer;
    z-index: 100;
    transition: all 200ms ease;
  `

	// 마커 배경 (물방울 모양)
	const markerBg = document.createElement('div')
	markerBg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    background: ${bgColor};
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  `
	
	// 아이콘 컨테이너 (중앙 배치)
	const iconContainer = document.createElement('div')
	iconContainer.style.cssText = `
    position: absolute;
    top: 6px;
    left: 6px;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
  `

	wrap.appendChild(markerBg)
	wrap.appendChild(iconContainer)

	// 호버 효과
	wrap.addEventListener('mouseenter', () => {
		wrap.style.transform = 'scale(1.2)'
		markerBg.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)'
		wrap.style.zIndex = '200'
	})
	wrap.addEventListener('mouseleave', () => {
		wrap.style.transform = 'scale(1)'
		markerBg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)'
		wrap.style.zIndex = '100'
	})

	const icon = getIconClassByType(type)
	if (icon) {
		const i = document.createElement('i')
		i.className = icon
		i.style.cssText = `
      font-size: 16px;
      line-height: 1;
      color: white;
      filter: none;
      transition: all 200ms ease;
    `
		iconContainer.appendChild(i)
	} else {
		// 기본 아이콘이 없는 경우 흰색 점
		const dot = document.createElement('div')
		dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: white;
    `
		iconContainer.appendChild(dot)
	}

	return wrap
}

export function makeUserMarkerEl(): HTMLElement {
	const wrap = document.createElement('div')
	wrap.setAttribute('aria-label', 'my-location')

	// 마커 모양 배경 스타일 (물방울 형태)
	wrap.style.cssText = `
    position: relative;
    width: 32px;
    height: 40px;
    cursor: pointer;
    z-index: 300;
    animation: pulse-marker 2s infinite;
  `

	// 마커 배경 (물방울 모양) - 사용자 위치는 파란색
	const markerBg = document.createElement('div')
	markerBg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    background: #3b82f6;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  `
	
	// 아이콘 컨테이너 (중앙 배치)
	const iconContainer = document.createElement('div')
	iconContainer.style.cssText = `
    position: absolute;
    top: 6px;
    left: 6px;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
  `

	wrap.appendChild(markerBg)
	wrap.appendChild(iconContainer)

	// 마커 펄스 애니메이션
	const style = document.createElement('style')
	style.textContent = `
    @keyframes pulse-marker {
      0%, 100% { 
        transform: scale(1);
      }
      50% { 
        transform: scale(1.1);
      }
    }
  `
	document.head.appendChild(style)

	const i = document.createElement('i')
	i.className = 'fi fi-rr-location-crosshairs'
	i.style.cssText = `
    font-size: 16px;
    line-height: 1;
    color: white;
    filter: none;
  `
	iconContainer.appendChild(i)

	return wrap
}

export function makeClusterMarkerEl(count: number): HTMLElement {
	const wrap = document.createElement('div')
	wrap.className = 'km-cluster'
	wrap.textContent = String(count)
	wrap.setAttribute('aria-label', `${count} places clustered`)

	return wrap
}
