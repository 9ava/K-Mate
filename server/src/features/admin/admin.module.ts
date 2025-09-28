import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { Comment } from '../comments/comment.entity';
import { Course } from '../courses/course.entity';
import { CourseStop } from '../courses/course-stop.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, Post, Comment, Course, CourseStop])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
