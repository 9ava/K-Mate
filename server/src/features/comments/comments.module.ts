// src/features/comments/comments.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommentsController } from './comments.controller'
import { CommentsService } from './comments.service'
import { Comment } from './comment.entity'
import { CourseComment } from './course-comment.entity'
import { Post } from '../posts/post.entity'
import { Course } from '../courses/course.entity'
import { User } from '../users/user.entity'

/**
 * CommentsModule - 댓글 관리
 *
 * 주요 기능:
 * - 댓글 CRUD
 * - community, trend 게시글에만 댓글 허용 (tips는 금지)
 * - DB 트리거로 정책 강제
 */
@Module({
	imports: [TypeOrmModule.forFeature([Comment, CourseComment, Post, Course, User])],
	controllers: [CommentsController],
	providers: [CommentsService],
	exports: [CommentsService],
})
export class CommentsModule {}
