// src/features/interactions/interactions.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InteractionsController } from './interactions.controller'
import { InteractionsService } from './interactions.service'
import { Interaction } from './interaction.entity'
import { Post } from '../posts/post.entity'
import { User } from '../users/user.entity'

@Module({
	imports: [TypeOrmModule.forFeature([Interaction, Post, User])],
	controllers: [InteractionsController],
	providers: [InteractionsService],
	exports: [InteractionsService],
})
export class InteractionsModule {}
