import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}
	canActivate(ctx: ExecutionContext) {
		const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			ctx.getHandler(),
			ctx.getClass(),
		])
		if (!required || required.length === 0) return true
		
		const { user } = ctx.switchToHttp().getRequest()
		if (!user) return false
		
		const hasRequiredRole = required.includes(user.role)
		if (!hasRequiredRole) return false
		
		const request = ctx.switchToHttp().getRequest()
		if (request.method === 'POST' && request.body?.postType) {
			const postType = request.body.postType
			if ((postType === 'tips' || postType === 'trend') && user.role !== 'admin') {
				return false
			}
		}

		return true
	}
}
