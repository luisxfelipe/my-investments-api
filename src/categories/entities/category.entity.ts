import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'category' })
export class Category {
  @ApiProperty({ description: 'Category ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Category Name' })
  @Column({ name: 'name', nullable: false, length: 50 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<Category>) {
    Object.assign(this, partial);
  }
}
