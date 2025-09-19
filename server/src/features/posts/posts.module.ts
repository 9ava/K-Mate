// src/features/posts/posts.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'
import { Post } from './post.entity'
import { User } from '../users/user.entity'
import { Comment } from '../comments/comment.entity'
import { Interaction } from '../interactions/interaction.entity'

/**
 * PostsModule - K-Buzz 게시글 관리
 * 
 * 주요 기능:
 * - 게시글 CRUD (정책에 따른 권한 제어)
 * - community: 모든 사용자 CRUD
 * - tips/trend: 관리자만 CRUD
 * - 상호작용 통계 포함 조회
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([Post, User, Comment, Interaction]),
	],
	controllers: [PostsController],
	providers: [PostsService],
	exports: [PostsService],
})
export class PostsModule {}
