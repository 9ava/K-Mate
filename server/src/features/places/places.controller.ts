import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { PlacesService } from './places.service'

@Controller('places')
export class PlacesController {
	constructor(private readonly service: PlacesService) {}

	@Get()
	list(@Query() query: any) {
		return this.service.findMany(query)
	}

	@Get(':id')
	detail(@Param('id', ParseIntPipe) id: number) {
		return this.service.findOne(id)
	}
}
