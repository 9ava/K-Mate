import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PostController } from './post.controller'
import { PostService } from './post.service'
import { Post } from './post.entity'
import { User } from '../users/user.entity'

/**
 * Post Module - 게시글 기능 모듈
 * 
 * 주요 기능:
 * - 게시글 CRUD 작업
 * - 게시글 타입별 관리 (community, tips)
 * - 권한 기반 접근 제어
 * - 검색 및 필터링
 * - 페이지네이션
 */
@Module({
	imports: [
		// TypeORM을 통한 Repository 주입
		// Post와 User 엔티티의 Repository를 주입 가능하도록 설정
		TypeOrmModule.forFeature([Post, User]),
	],
	controllers: [PostController],
	providers: [PostService],
	exports: [
		// 다른 모듈에서 PostService를 사용할 수 있도록 export
		PostService,
		// TypeORM Repository도 export (필요시 다른 모듈에서 사용)
		TypeOrmModule,
	],
})
export class PostModule {}
