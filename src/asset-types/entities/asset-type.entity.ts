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

@Entity({ name: 'asset_type' })
@Unique('UQ_asset_type_name_user', ['name', 'userId'])
export class AssetType {
  @ApiProperty({ description: 'Asset Type ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Asset Type Name' })
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

  constructor(partial: Partial<AssetType>) {
    Object.assign(this, partial);
  }
}
