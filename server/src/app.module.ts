import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'

// feature modules
import { AuthModule } from './features/auth/auth.module'
import { PlacesModule } from './features/places/places.module'

@Module({
	imports: [
		// .env 로드 (전역)
		ConfigModule.forRoot({ isGlobal: true }),

		// DB설정은 DatabaseModule에서 import
		DatabaseModule,

		// features
		AuthModule,
		PlacesModule,
		// UsersModule,  ... (추가 시 여기에 import)
	],
})
export class AppModule {}
