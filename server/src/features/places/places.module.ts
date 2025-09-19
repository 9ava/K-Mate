
// src/features/places/places.module.ts
import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PlacesController } from './places.controller'
import { PlacesService } from './places.service'
import { Place } from './place.entity'
import { PlaceBookmark } from './place-bookmark.entity'
import { User } from '../users/user.entity'

/**
 * PlacesModule
 * - Google Places 연동 + 장소 관리 + 북마크
 */
@Module({
	imports: [
		HttpModule.register({ timeout: 8000 }), // axios 기반 Nest HttpService
	TypeOrmModule.forFeature([Place, PlaceBookmark, User]),
	],
	controllers: [PlacesController],
	providers: [PlacesService],
	exports: [PlacesService],
})
export class PlacesModule {}
