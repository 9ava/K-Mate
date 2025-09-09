import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'
import { Comment } from './comment.entity'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'

/**
 * Comment Module - 댓글 기능 모듈
 * 
 * 주요 기능:
 * - 댓글 CRUD 작업
 * - 게시글과 댓글 간의 관계 관리
 * - 권한 기반 접근 제어
 * - 페이지네이션
 */
@Module({
	imports: [
		// TypeORM을 통한 Repository 주입
		// Comment, User, Post 엔티티의 Repository를 주입 가능하도록 설정
		TypeOrmModule.forFeature([Comment, User, Post]),
	],
	controllers: [CommentController],
	providers: [CommentService],
	exports: [
		// 다른 모듈에서 CommentService를 사용할 수 있도록 export
		CommentService,
		// TypeORM Repository도 export (필요시 다른 모듈에서 사용)
		TypeOrmModule,
	],
})
export class CommentModule {}
