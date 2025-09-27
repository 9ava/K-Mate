import { Controller, Post, Body, UseGuards, Req, Get, Query, Param, Put, Delete } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
	ApiBearerAuth,
	ApiBody,
} from '@nestjs/swagger'
import { CoursesService } from './courses.service'
import { CreateCourseDto } from './create-course.dto'
import { ToggleAdvertisementDto } from './toggle-advertisement.dto'
import { Course } from './course.entity'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

/**
 * 여행 코스 관리 컨트롤러
 * - 코스 생성/조회 기능 제공
 * - JWT 쿠키 인증 기반
 */
@ApiTags('courses')
@Controller('courses')
export class CoursesController {
	constructor(private readonly coursesService: CoursesService) {}

	/**
	 * 새로운 여행 코스 생성
	 * - 로그인한 사용자만 가능
	 * - 제목, 공개설정, 경유지 목록 필수
	 */
	@ApiOperation({
		summary: '여행 코스 생성',
		description: '새로운 여행 코스를 생성합니다. 로그인이 필요합니다.',
	})
	@ApiBody({
		type: CreateCourseDto,
		description: '생성할 코스 정보',
	})
	@ApiResponse({
		status: 201,
		description: '코스가 성공적으로 생성됨',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: {
					$ref: '#/components/schemas/Course',
				},
			},
		},
	})
	@ApiResponse({
		status: 401,
		description: '인증 실패 - 로그인 필요',
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청 데이터',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Post()
	async create(@Body() dto: CreateCourseDto, @Req() req: any) {
		const me = req.user // JwtCookieStrategy에서 return한 { id, email, role }
		const created = await this.coursesService.create(dto, String(me.id))
		return { success: true, data: created }
	}

	/**
	 * 공개 코스 목록 조회
	 * - 페이지네이션 지원
	 * - visibility='public'인 코스만 반환
	 */
	@ApiOperation({
		summary: '공개 코스 목록 조회',
		description: '공개 설정된 코스들을 페이지네이션으로 조회합니다.',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: '페이지 번호 (기본값: 1)',
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: '페이지당 항목 수 (기본값: 10)',
		example: 10,
	})
	@ApiResponse({
		status: 200,
		description: '공개 코스 목록 조회 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: {
					type: 'array',
					items: { $ref: '#/components/schemas/Course' },
				},
				pagination: {
					type: 'object',
					properties: {
						page: { type: 'number', example: 1 },
						limit: { type: 'number', example: 10 },
						total: { type: 'number', example: 50 },
						totalPages: { type: 'number', example: 5 },
					},
				},
			},
		},
	})
	@Get('public')
	async getPublicCourses(@Query('page') page = 1, @Query('limit') limit = 10) {
		const result = await this.coursesService.getPublicCourses(Number(page), Number(limit))
		return {
			success: true,
			data: result.courses,
			pagination: result.pagination,
		}
	}

	/**
	 * 내 코스 목록 조회
	 * - 로그인한 사용자가 작성한 코스 + 저장한 코스
	 * - 공개/비공개 모든 코스 포함
	 */
	@ApiOperation({
		summary: '내 코스 목록 조회',
		description: '로그인한 사용자가 작성한 코스와 저장한 코스를 모두 조회합니다.',
	})
	@ApiQuery({
		name: 'me',
		required: false,
		type: String,
		description: '내 코스 조회 여부 (true)',
		example: 'true',
	})
	@ApiResponse({
		status: 200,
		description: '내 코스 목록 조회 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: {
					type: 'object',
					properties: {
						myCourses: {
							type: 'array',
							items: { $ref: '#/components/schemas/Course' },
							description: '내가 작성한 코스들',
						},
						savedCourses: {
							type: 'array',
							items: { $ref: '#/components/schemas/Course' },
							description: '내가 저장한 코스들',
						},
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 401,
		description: '인증 실패 - 로그인 필요',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Get()
	async listMine(@Query('me') me: string, @Req() req: any) {
		if (me === 'true') {
			const myCourses = await this.coursesService.findMine(String(req.user.id))
			const savedCourses = await this.coursesService.getSavedCourses(String(req.user.id))
			return { 
				success: true, 
				data: {
					myCourses,
					savedCourses,
				}
			}
		}
		// 공개 코스 목록 등 확장 가능
		return { success: true, data: { myCourses: [], savedCourses: [] } }
	}

	/**
	 * 저장된 코스 목록 조회
	 * - 내가 저장한 다른 사용자의 코스들
	 */
	@ApiOperation({
		summary: '저장된 코스 목록 조회',
		description: '내가 저장한 다른 사용자의 코스들을 조회합니다.',
	})
	@ApiResponse({
		status: 200,
		description: '저장된 코스 목록 조회 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: {
					type: 'array',
					items: { $ref: '#/components/schemas/Course' },
				},
			},
		},
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Get('saved/list')
	async getSavedCourses(@Req() req: any) {
		const courses = await this.coursesService.getSavedCourses(String(req.user.id))
		return { success: true, data: courses }
	}

	/**
	 * 특정 코스 상세 조회
	 * - 공개 코스는 누구나 조회 가능
	 * - 비공개 코스는 작성자만 조회 가능
	 */
	@ApiOperation({
		summary: '코스 상세 조회',
		description: '특정 코스의 상세 정보를 조회합니다. 비공개 코스는 작성자만 조회 가능합니다.',
	})
	@ApiParam({
		name: 'id',
		description: '조회할 코스 ID',
		example: '123',
	})
	@ApiResponse({
		status: 200,
		description: '코스 조회 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: { $ref: '#/components/schemas/Course' },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: '코스를 찾을 수 없음',
	})
	@ApiResponse({
		status: 403,
		description: '비공개 코스 접근 권한 없음',
	})
	@Get(':id')
	async getOne(@Param('id') id: string, @Req() req: any) {
		const userId = req?.user?.id // 로그인 안 됐을 수도 있음
		const course = await this.coursesService.findOne(id, userId ? String(userId) : undefined)
		return { success: true, data: course }
	}

	/**
	 * 코스 업데이트
	 * - 작성자만 수정 가능
	 */
	@ApiOperation({
		summary: '코스 수정',
		description: '코스를 수정합니다. 작성자만 가능합니다.',
	})
	@ApiParam({
		name: 'id',
		description: '수정할 코스 ID',
		example: '123',
	})
	@ApiBody({
		type: CreateCourseDto,
		description: '수정할 코스 정보',
	})
	@ApiResponse({
		status: 200,
		description: '코스 수정 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: { $ref: '#/components/schemas/Course' },
			},
		},
	})
	@ApiResponse({
		status: 403,
		description: '수정 권한 없음',
	})
	@ApiResponse({
		status: 404,
		description: '코스를 찾을 수 없음',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: CreateCourseDto, @Req() req: any) {
		const updated = await this.coursesService.update(id, dto, String(req.user.id))
		return { success: true, data: updated }
	}

	/**
	 * 코스 삭제
	 * - 작성자만 삭제 가능
	 */
	@ApiOperation({
		summary: '코스 삭제',
		description: '코스를 삭제합니다. 작성자만 가능합니다.',
	})
	@ApiParam({
		name: 'id',
		description: '삭제할 코스 ID',
		example: '123',
	})
	@ApiResponse({
		status: 200,
		description: '코스 삭제 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				message: { type: 'string', example: '코스가 삭제되었습니다.' },
			},
		},
	})
	@ApiResponse({
		status: 403,
		description: '삭제 권한 없음',
	})
	@ApiResponse({
		status: 404,
		description: '코스를 찾을 수 없음',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Delete(':id')
	async delete(@Param('id') id: string, @Req() req: any) {
		await this.coursesService.delete(id, String(req.user.id))
		return { success: true, message: '코스가 삭제되었습니다.' }
	}

	/**
	 * 코스 저장/북마크
	 * - 다른 사용자의 코스를 내 목록에 저장
	 */
	@ApiOperation({
		summary: '코스 저장/북마크',
		description: '다른 사용자의 코스를 내 목록에 저장합니다.',
	})
	@ApiParam({
		name: 'id',
		description: '저장할 코스 ID',
		example: '123',
	})
	@ApiResponse({
		status: 200,
		description: '코스 저장 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				message: { type: 'string', example: '코스가 저장되었습니다.' },
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '자신의 코스는 저장할 수 없음',
	})
	@ApiResponse({
		status: 404,
		description: '코스를 찾을 수 없음',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Post(':id/save')
	async saveCourse(@Param('id') id: string, @Req() req: any) {
		await this.coursesService.saveCourse(id, String(req.user.id))
		return { success: true, message: '코스가 저장되었습니다.' }
	}

	/**
	 * 코스 저장 취소
	 * - 저장했던 코스를 내 목록에서 제거
	 */
	@ApiOperation({
		summary: '코스 저장 취소',
		description: '저장했던 코스를 내 목록에서 제거합니다.',
	})
	@ApiParam({
		name: 'id',
		description: '저장 취소할 코스 ID',
		example: '123',
	})
	@ApiResponse({
		status: 200,
		description: '코스 저장 취소 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				message: { type: 'string', example: '코스 저장이 취소되었습니다.' },
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: '저장된 코스를 찾을 수 없음',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'))
	@Delete(':id/save')
	async unsaveCourse(@Param('id') id: string, @Req() req: any) {
		await this.coursesService.unsaveCourse(id, String(req.user.id))
		return { success: true, message: '코스 저장이 취소되었습니다.' }
	}

	/**
	 * 코스 광고 상태 토글
	 * - 관리자만 가능
	 */
	@ApiOperation({
		summary: '코스 광고 상태 토글',
		description: '관리자가 코스의 광고 상태를 변경합니다.',
	})
	@ApiParam({
		name: 'id',
		description: '광고 상태를 변경할 코스 ID',
		example: '123',
	})
	@ApiBody({
		type: ToggleAdvertisementDto,
		description: '광고 상태 설정',
	})
	@ApiResponse({
		status: 200,
		description: '광고 상태 변경 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				data: { $ref: '#/components/schemas/Course' },
			},
		},
	})
	@ApiResponse({
		status: 403,
		description: '관리자 권한 필요',
	})
	@ApiResponse({
		status: 404,
		description: '코스를 찾을 수 없음',
	})
	@ApiBearerAuth('JWT-Cookie')
	@UseGuards(AuthGuard('jwt-cookie'), RolesGuard)
	@Roles('admin')
	@Put(':id/advertisement')
	async toggleAdvertisement(@Param('id') id: string, @Body() dto: ToggleAdvertisementDto) {
		const course = await this.coursesService.toggleAdvertisement(id, dto.isAdvertisement)
		return { success: true, data: course }
	}
}
