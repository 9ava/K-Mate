import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { toZonedTime, format } from 'date-fns-tz'

const ZONE = 'Asia/Seoul'
const OUT_FMT = 'yyyy-MM-dd HH:mm:ss'

function convertDate(value: any): any {
	if (value instanceof Date) {
		const kst = toZonedTime(value, ZONE)
		return format(kst, OUT_FMT, { timeZone: ZONE })
	}
	if (Array.isArray(value)) return value.map((v) => convertDate(v))
	if (value && typeof value === 'object') {
		const out: any = {}
		for (const key of Object.keys(value)) {
			out[key] = convertDate(value[key])
		}
		return out
	}
	return value
}

@Injectable()
export class DateInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(map((data) => convertDate(data)))
	}
}
