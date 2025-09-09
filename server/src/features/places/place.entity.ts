import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type PlaceType = 'travel' | 'food' | 'cafe'

// DECIMAL(9,6) → number 변환
const decimalToNumber = {
	to: (v?: number | null) => v ?? null,
	from: (v?: string | number | null) => (v === null || v === undefined ? null : Number(v)),
}

@Entity({ name: 'places' })
@Index('idx_places_type', ['type'])
@Index('idx_places_lat_lng', ['lat', 'lng'])
export class Place {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
	id!: number

	@Column({ type: 'enum', enum: ['travel', 'food', 'cafe'] })
	type!: PlaceType

	@Column({ type: 'varchar', length: 255 })
	name!: string

	@Column({ type: 'text', nullable: true })
	description!: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, unique: true })
	google_place_id!: string | null

	@Column({ type: 'decimal', precision: 9, scale: 6, transformer: decimalToNumber })
	lat!: number

	@Column({ type: 'decimal', precision: 9, scale: 6, transformer: decimalToNumber })
	lng!: number

	@Column({ type: 'varchar', length: 255, nullable: true })
	address!: string | null

	@Column({ type: 'varchar', length: 50, nullable: true })
	phone!: string | null

	@Column({ type: 'varchar', length: 255, nullable: true })
	website!: string | null
}
