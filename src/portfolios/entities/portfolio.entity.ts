import { ApiProperty } from '@nestjs/swagger';
import { Asset } from 'src/assets/entities/asset.entity';
import { Platform } from 'src/platforms/entities/platform.entity';
import { SavingGoal } from 'src/savings-goals/entities/saving-goal.entity';
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

@Entity({ name: 'portfolio' })
@Unique('UQ_user_asset_platform', ['userId', 'assetId', 'platformId'])
export class Portfolio {
  @ApiProperty({ description: 'Portfolio ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: 'Asset ID' })
  @Column({ name: 'asset_id' })
  assetId: number;

  @ApiProperty({ description: 'Platform ID' })
  @Column({ name: 'platform_id' })
  platformId: number;

  @ApiProperty({ description: 'Savings Goal ID', required: false })
  @Column({ name: 'savings_goal_id', nullable: true })
  savingsGoalId: number;

  @ApiProperty({ description: 'Current Balance' })
  @Column({
    name: 'current_balance',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  currentBalance: number;

  @ApiProperty({ description: 'Average Price' })
  @Column({
    name: 'average_price',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  averagePrice: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @ManyToOne(() => Platform)
  @JoinColumn({ name: 'platform_id' })
  platform: Platform;

  @ManyToOne(() => SavingGoal, { nullable: true })
  @JoinColumn({ name: 'savings_goal_id' })
  savingGoal: SavingGoal;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<Portfolio>) {
    Object.assign(this, partial);
  }
}
