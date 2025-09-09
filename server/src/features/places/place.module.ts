import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PlaceController } from './place.controller'
import { PlaceService } from './place.service'
import { Place } from './place.entity'

/**
 * Place Module - 장소 기능 모듈
 * 
 * 주요 기능:
 * - 장소 CRUD 작업
 * - 장소 타입별 관리 (travel, food, cafe)
 * - 위치 기반 검색
 * - 반경 내 장소 검색
 * - 페이지네이션
 */
@Module({
	imports: [
		// TypeORM을 통한 Repository 주입
		// Place 엔티티의 Repository를 주입 가능하도록 설정
		TypeOrmModule.forFeature([Place]),
	],
	controllers: [PlaceController],
	providers: [PlaceService],
	exports: [
		// 다른 모듈에서 PlaceService를 사용할 수 있도록 export
		PlaceService,
		// TypeORM Repository도 export (필요시 다른 모듈에서 사용)
		TypeOrmModule,
	],
})
export class PlaceModule {}
