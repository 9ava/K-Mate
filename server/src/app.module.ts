import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

// feature modules
import { AuthModule } from './features/auth/auth.module'
import { PlacesModule } from './features/places/places.module'
import { PostsModule } from './features/posts/posts.module'
import { InteractionsModule } from './features/interactions/interactions.module'
import { CommentsModule } from './features/comments/comments.module'
import { CoursesModule } from './features/courses/courses.module'
import { AdminModule } from './features/admin/admin.module'
import { S3Module } from './s3/s3.module'



/**
 * App Module - K-Buzz 애플리케이션 메인 모듈
 * 
 * 주요 기능:
 * - 전역 설정 관리 (환경변수, 데이터베이스)
 * - 인증 시스템 (Google OAuth + JWT)
 * - 장소 관리 시스템
 */
@Module({
	imports: [
		// .env 로드 (전역)
		ConfigModule.forRoot({ isGlobal: true }),

		// DB설정은 DatabaseModule에서 import
		DatabaseModule,


		// features - ERD 구조에 따른 모듈 구성
		AuthModule,           // 인증 시스템 (Google OAuth + JWT)
		PlacesModule,
		PostsModule,
		InteractionsModule,
		CommentsModule,
		CoursesModule,
		AdminModule,
		S3Module,
		// UsersModule,  ... (추가 시 여기에 import)

	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
