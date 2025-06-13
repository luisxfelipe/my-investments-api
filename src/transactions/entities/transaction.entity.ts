import { ApiProperty } from '@nestjs/swagger';
import { Portfolio } from 'src/portfolios/entities/portfolio.entity';
import { TransactionReason } from 'src/transaction-reasons/entities/transaction-reason.entity';
import { TransactionType } from 'src/transaction-types/entities/transaction-type.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'transaction' })
export class Transaction {
  @ApiProperty({ description: 'Transaction ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Portfolio ID' })
  @Column({ name: 'portfolio_id' })
  portfolioId: number;

  @ApiProperty({ description: 'Transaction Type ID' })
  @Column({ name: 'transaction_type_id' })
  transactionTypeId: number;

  @ApiProperty({ description: 'Transaction Reason ID' })
  @Column({ name: 'transaction_reason_id' })
  transactionReasonId: number;

  @ApiProperty({ description: 'Quantity' })
  @Column({ name: 'quantity', type: 'decimal', precision: 18, scale: 8 })
  quantity: number;

  @ApiProperty({ description: 'Unit Price' })
  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 8 })
  unitPrice: number;

  @ApiProperty({ description: 'Total Value' })
  @Column({ name: 'total_value', type: 'decimal', precision: 18, scale: 8 })
  totalValue: number;

  @ApiProperty({ description: 'Transaction Date' })
  @Column({ name: 'transaction_date', type: 'datetime' })
  transactionDate: Date;

  @ApiProperty({ description: 'Fee', required: false })
  @Column({
    name: 'fee',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
  })
  fee?: number;

  @ApiProperty({ description: 'Notes', required: false })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({
    description: 'Linked Transaction ID (for transfers)',
    required: false,
  })
  @Column({ name: 'linked_transaction_id', nullable: true })
  linkedTransactionId?: number;

  @ApiProperty({ description: 'Current balance after this transaction' })
  @Column({
    name: 'current_balance',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  currentBalance: number;

  @ApiProperty({ description: 'Average price after this transaction' })
  @Column({
    name: 'average_price',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 0,
  })
  averagePrice: number;

  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @ManyToOne(() => TransactionType)
  @JoinColumn({ name: 'transaction_type_id' })
  transactionType: TransactionType;

  @ManyToOne(() => TransactionReason)
  @JoinColumn({ name: 'transaction_reason_id' })
  transactionReason: TransactionReason;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'linked_transaction_id' })
  linkedTransaction?: Transaction;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }
}
