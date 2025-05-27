import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'platform' })
export class Platform {
  @ApiProperty({ description: 'Platform ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Platform Name' })
  @Column({ name: 'name', nullable: false, length: 50 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<Platform>) {
    Object.assign(this, partial);
  }
}
