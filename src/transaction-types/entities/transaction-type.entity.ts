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
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'transaction_type' })
@Unique('UQ_transaction_type_name_user', ['name', 'userId'])
export class TransactionType {
  @ApiProperty({ description: 'Transaction Type ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Transaction Type Name' })
  @Column({ name: 'name', nullable: false, length: 50 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<TransactionType>) {
    Object.assign(this, partial);
  }
}
