// src/features/mypage/mypage.module.ts - 마이페이지 모듈
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MypageController } from './mypage.controller'
import { MypageService } from './mypage.service'
import { User } from '../users/user.entity'
import { PlaceBookmark } from '../places/place-bookmark.entity'
import { Interaction } from '../interactions/interaction.entity'
import { Post } from '../posts/post.entity'
import { Comment } from '../comments/comment.entity'

/**
 * MypageModule
 * - 사용자 마이페이지 관련 기능 제공
 * - 활동 통계, 북마크, 스크랩, 게시글, 댓글 관리
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			PlaceBookmark,
			Interaction,
			Post,
			Comment,
		]),
	],
	controllers: [MypageController],
	providers: [MypageService],
	exports: [MypageService],
})
export class MypageModule {}
