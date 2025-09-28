import { Injectable, OnModuleInit } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'

@Injectable()
export class DbInitService implements OnModuleInit {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async onModuleInit() {
		await this.dropAndRecreateCourseCommentsTable()
		await this.addHasMultilingualMenuColumn()
	}

	private async dropAndRecreateCourseCommentsTable() {
		try {
			console.log('Dropping existing course_comments table if exists...')
			await this.dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`)
			await this.dataSource.query(`DROP TABLE IF EXISTS course_comments`)
			await this.dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`)
			console.log('course_comments table dropped successfully')

			console.log('Creating course_comments table with correct schema (no FK constraints - let TypeORM handle them)...')
			await this.dataSource.query(`
				CREATE TABLE course_comments (
					id bigint unsigned NOT NULL AUTO_INCREMENT,
					content text NOT NULL,
					created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
					course_id bigint unsigned NOT NULL,
					user_id bigint unsigned NOT NULL,
					PRIMARY KEY (id),
					INDEX IDX_course_comments_course_id (course_id),
					INDEX IDX_course_comments_user_id (user_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
			`)
			console.log('course_comments table created successfully (TypeORM will add FK constraints during synchronization)')
		} catch (error) {
			console.log('Error managing course_comments table:', error)
			try {
				await this.dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`)
			} catch (e) {
				console.log('Error resetting foreign key checks:', e)
			}
		}
	}

	private async addHasMultilingualMenuColumn() {
		try {
			console.log('Adding has_multilingual_menu column to places table...')
			await this.dataSource.query(`
				ALTER TABLE places
				ADD COLUMN has_multilingual_menu BOOLEAN DEFAULT FALSE COMMENT '다국어 메뉴판 지원 여부'
			`)
			console.log('has_multilingual_menu column added successfully')
		} catch (error) {
			if (error.code === 'ER_DUP_FIELDNAME') {
				console.log('has_multilingual_menu column already exists')
			} else {
				console.log('Error adding has_multilingual_menu column:', error.message)
			}
		}

	}
}