import { ApiProperty } from '@nestjs/swagger';
import { PortfolioResponseDto } from 'src/portfolios/dto/portfolio-response.dto';
import { TransactionTypeResponseDto } from 'src/transaction-types/dto/transaction-type-response.dto';
import { TransactionReasonResponseDto } from 'src/transaction-reasons/dto/transaction-reason-response.dto';
import { Transaction } from '../entities/transaction.entity';
import { FeeType } from '../../constants/fee-types.constants';

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: number;

  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: number;

  @ApiProperty({ description: 'Transaction Type ID' })
  transactionTypeId: number;

  @ApiProperty({ description: 'Transaction Reason ID' })
  transactionReasonId: number;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit Price' })
  unitPrice: number;

  @ApiProperty({ description: 'Total Value' })
  totalValue: number;

  @ApiProperty({ description: 'Transaction Date' })
  transactionDate: Date;

  @ApiProperty({ description: 'Fee', required: false })
  fee?: number;

  @ApiProperty({
    description:
      'Fee type (percentage_target, percentage_source, fixed_source, fixed_target)',
    enum: FeeType,
    required: false,
  })
  feeType?: FeeType;

  @ApiProperty({ description: 'Notes', required: false })
  notes?: string;

  @ApiProperty({
    description: 'Linked Transaction ID (for transfers)',
    required: false,
  })
  linkedTransactionId?: number;

  @ApiProperty({ description: 'Portfolio', type: PortfolioResponseDto })
  portfolio?: PortfolioResponseDto;

  @ApiProperty({
    description: 'Transaction Type',
    type: TransactionTypeResponseDto,
  })
  transactionType?: TransactionTypeResponseDto;

  @ApiProperty({
    description: 'Transaction Reason',
    type: TransactionReasonResponseDto,
  })
  transactionReason?: TransactionReasonResponseDto;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.portfolioId = transaction.portfolioId;
    this.transactionTypeId = transaction.transactionTypeId;
    this.transactionReasonId = transaction.transactionReasonId;
    this.quantity = Number(transaction.quantity);
    this.unitPrice = Number(transaction.unitPrice);
    this.totalValue = Number(transaction.totalValue);
    this.transactionDate = transaction.transactionDate;
    this.fee = transaction.fee ? Number(transaction.fee) : transaction.fee;
    this.feeType = transaction.feeType;
    this.notes = transaction.notes;
    this.linkedTransactionId = transaction.linkedTransactionId;

    if (transaction.portfolio) {
      this.portfolio = new PortfolioResponseDto(transaction.portfolio);
    }

    if (transaction.transactionType) {
      this.transactionType = new TransactionTypeResponseDto(
        transaction.transactionType,
      );
    }

    if (transaction.transactionReason) {
      this.transactionReason = new TransactionReasonResponseDto(
        transaction.transactionReason,
      );
    }
  }
}
