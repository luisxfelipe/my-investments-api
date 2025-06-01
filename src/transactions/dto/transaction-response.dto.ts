import { ApiProperty } from '@nestjs/swagger';
import { PortfolioResponseDto } from 'src/portfolios/dto/portfolio-response.dto';
import { TransactionTypeResponseDto } from 'src/transaction-types/dto/transaction-type-response.dto';
import { Transaction } from '../entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: number;

  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: number;

  @ApiProperty({ description: 'Transaction Type ID' })
  transactionTypeId: number;

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

  @ApiProperty({ description: 'Notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Portfolio', type: PortfolioResponseDto })
  portfolio?: PortfolioResponseDto;

  @ApiProperty({
    description: 'Transaction Type',
    type: TransactionTypeResponseDto,
  })
  transactionType?: TransactionTypeResponseDto;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.portfolioId = transaction.portfolioId;
    this.transactionTypeId = transaction.transactionTypeId;
    this.quantity = Number(transaction.quantity);
    this.unitPrice = Number(transaction.unitPrice);
    this.totalValue = Number(transaction.totalValue);
    this.transactionDate = transaction.transactionDate;
    this.fee = transaction.fee ? Number(transaction.fee) : transaction.fee;
    this.notes = transaction.notes;

    if (transaction.portfolio) {
      this.portfolio = new PortfolioResponseDto(transaction.portfolio);
    }

    if (transaction.transactionType) {
      this.transactionType = new TransactionTypeResponseDto(
        transaction.transactionType,
      );
    }
  }
}
