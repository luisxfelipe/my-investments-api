import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'category' })
@Unique('UQ_category_name_user', ['name', 'userId'])
export class Category {
  @ApiProperty({ description: 'Category ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Category Name' })
  @Column({ name: 'name', nullable: false, length: 50 })
  name: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

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
