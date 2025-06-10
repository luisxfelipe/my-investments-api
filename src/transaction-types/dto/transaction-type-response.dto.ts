import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../entities/transaction-type.entity';

export class TransactionTypeResponseDto {
  @ApiProperty({ description: 'Transaction Type ID' })
  id: number;

  @ApiProperty({ description: 'Transaction Type' })
  type: string;

  constructor(transactionType: TransactionType) {
    this.id = transactionType.id;
    this.type = transactionType.type;
  }
}
