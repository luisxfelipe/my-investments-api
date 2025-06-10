import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from 'src/asset-types/entities/asset-type.entity';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'asset' })
@Unique('UQ_asset_user_code', ['userId', 'code'])
@Unique('UQ_asset_user_name', ['userId', 'name'])
export class Asset {
  @ApiProperty({ description: 'Asset ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: 'Asset Name' })
  @Column({ name: 'name', nullable: false, length: 100 })
  name: string;

  @ApiProperty({ description: 'Asset Code/Ticker', required: false })
  @Column({ name: 'code', nullable: true, length: 20 })
  code: string;

  @ApiProperty({ description: 'Category ID' })
  @Column({ name: 'category_id' })
  categoryId: number;

  @ApiProperty({ description: 'Asset Type ID' })
  @Column({ name: 'asset_type_id' })
  assetTypeId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => AssetType)
  @JoinColumn({ name: 'asset_type_id' })
  assetType: AssetType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<Asset>) {
    Object.assign(this, partial);
  }
}
