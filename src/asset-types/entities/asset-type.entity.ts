import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'asset_type' })
@Unique('UQ_asset_type_name', ['name'])
export class AssetType {
  @ApiProperty({ description: 'Asset Type ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Asset Type Name' })
  @Column({ name: 'name', nullable: false, length: 50 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<AssetType>) {
    Object.assign(this, partial);
  }
}
