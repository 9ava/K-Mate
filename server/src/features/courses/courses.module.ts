import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { CoursesController } from './courses.controller'
import { CoursesService } from './courses.service'
import { Course } from './course.entity'
import { CourseStop } from './course-stop.entity'
import { SavedCourse } from './saved-course.entity'

/**
 * 여행 코스 모듈
 * - 코스 생성, 조회, 관리 기능 제공
 * - Course와 CourseStop 엔티티 관리
 * - JWT 쿠키 인증 기반 접근 제어
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([Course, CourseStop, SavedCourse]),
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'default-secret',
			signOptions: { expiresIn: '1h' },
		}),
	],
	controllers: [CoursesController],
	providers: [CoursesService],
	exports: [CoursesService],
})
export class CoursesModule {}
