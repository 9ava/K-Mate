import { Controller, Get, Res } from '@nestjs/common'
import { AppService } from './app.service'
import type { Response } from 'express'
import { join } from 'path'

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		return this.appService.getHello()
	}

	// Catch-all route to serve React app for client-side routing
	// @Get('*')
	// serveFrontend(@Res() res: Response): void {
	// 	res.sendFile(join(__dirname, '..', 'public', 'index.html'))
	// }
}
