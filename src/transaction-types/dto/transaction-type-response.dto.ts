import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../entities/transaction-type.entity';

export class TransactionTypeResponseDto {
  @ApiProperty({ description: 'Transaction Type ID' })
  id: number;

  @ApiProperty({ description: 'Transaction Type Name' })
  name: string;

  constructor(transactionType: TransactionType) {
    this.id = transactionType.id;
    this.name = transactionType.name;
  }
}
