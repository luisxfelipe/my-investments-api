import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionType } from '../../transaction-types/entities/transaction-type.entity';

@Entity('transaction_reason')
export class TransactionReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Column({ name: 'transaction_type_id' })
  transactionTypeId: number;

  @ManyToOne(() => TransactionType, { eager: true })
  @JoinColumn({ name: 'transaction_type_id' })
  transactionType: TransactionType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(partial: Partial<TransactionReason>) {
    Object.assign(this, partial);
  }
}
