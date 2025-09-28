import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DbInitService } from './db-init.service'

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: 'mysql',
				host: process.env.DB_HOST,
				port: Number(process.env.DB_PORT ?? 3306),
				username: process.env.DB_USER,
				password: process.env.DB_PASS,
				database: process.env.DB_NAME,
				charset: 'utf8mb4',
				ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
				autoLoadEntities: true,
				synchronize: false,
				logging: true,
			}),
		}),
	],
	providers: [DbInitService],
	exports: [TypeOrmModule],
})
export class DatabaseModule {}
