import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const KST = 'Asia/Seoul'

// 문자열에 타임존 표시가 있는지 검사: 끝이 Z 또는 +09:00 / -07:00 같은 오프셋
function hasTZ(s: string) {
	return /[zZ]|[+\-]\d{2}:?\d{2}$/.test(s)
}

/** "YYYY-MM-DD HH:mm:ss" (KST) */
export function toKstString(input: string | number | Date) {
	// 1) 문자열인 경우
	if (typeof input === 'string') {
		if (hasTZ(input)) {
			// "2025-09-21T07:00:00.000Z" 같은 UTC/오프셋 포함 → KST로 변환
			return dayjs.utc(input).tz(KST).format('YYYY-MM-DD HH:mm:ss')
		}
		// 타임존 없는 평문 → 서버가 이미 KST일 수 있음. 있는 그대로 보여주되 포맷만 정리
		// ISO형(2025-09-21T16:21:40)면 T를 공백으로 바꾸고 초까지 자르기
		const normalized = input.replace('T', ' ')
		return normalized.slice(0, 19) // "YYYY-MM-DD HH:mm:ss"
	}

	// 2) 숫자/Date → KST로 변환
	return dayjs(input).tz(KST).format('YYYY-MM-DD HH:mm:ss')
}

/** "YYYY-MM-DD HH:mm" (KST) */
export function toKstShort(input: string | number | Date) {
	if (typeof input === 'string') {
		if (hasTZ(input)) {
			return dayjs.utc(input).tz(KST).format('YYYY-MM-DD HH:mm')
		}
		const normalized = input.replace('T', ' ')
		return normalized.slice(0, 16) // "YYYY-MM-DD HH:mm"
	}
	return dayjs(input).tz(KST).format('YYYY-MM-DD HH:mm')
}

// UTC로 오는 API 값을 KST로 "반드시" 바꾸는 버전
export function toKstFromUtc(input: string | number | Date) {
	return dayjs.utc(input).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
}
export function toKstFromUtcShort(input: string | number | Date) {
	return dayjs.utc(input).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm')
}
