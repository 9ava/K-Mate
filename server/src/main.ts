// main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { DateInterceptor } from './common/interceptors/date.interceptor'

async function bootstrap() {
	// CORS는 아래에서 명시적으로 켬
	const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false })

	// ✅ HttpOnly 쿠키 파싱
	app.use(cookieParser())

	// ✅ Static files serving for React client
	//app.useStaticAssets(join(__dirname, '..', 'public'))
	//app.setBaseViewsDir(join(__dirname, '..', 'public'))

	// ✅ 로컬 및 프로덕션 프론트 허용 + 쿠키 전송 허용
	app.enableCors({
		origin: [
			'http://localhost:5173',
			'http://127.0.0.1:5173',
			// Add your Amplify domain here when available
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})

	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

	app.useGlobalInterceptors(new DateInterceptor())

	// ✅ Swagger에서 쿠키 인증 사용 가능하도록 (access_token 쿠키)
	const config = new DocumentBuilder()
		.setTitle('K-Mate API')
		.setDescription('K-Mate Backend API Docs')
		.setVersion('1.0.0')
		.addCookieAuth('access_token', { type: 'apiKey', in: 'cookie' })
		// .addBearerAuth()  // Bearer도 병행하려면 주석 해제
		.build()

	const doc = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('/docs', app, doc)

	const port = Number(process.env.APP_PORT ?? 3000)
	await app.listen(port)
	console.log(`API listening on http://localhost:${port}`)
}
bootstrap()
