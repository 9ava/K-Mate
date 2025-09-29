import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsNotEmpty } from 'class-validator'

export class AddAdminDto {
	@ApiProperty({
		description: 'The email of the user to be promoted to admin.',
		example: 'user@example.com',
	})
	@IsEmail()
	@IsNotEmpty()
	email: string
}

export class UpdateUserRoleDto {
	@ApiProperty({
		description: "The new role for the user. Must be either 'user' or 'admin'.",
		example: 'admin',
	})
	@IsNotEmpty()
	@IsIn(['user', 'admin'])
	role: 'user' | 'admin'
}
