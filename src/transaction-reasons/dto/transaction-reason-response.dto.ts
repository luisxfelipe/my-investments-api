import { ApiProperty } from '@nestjs/swagger';
import { TransactionTypeResponseDto } from 'src/transaction-types/dto/transaction-type-response.dto';
import { TransactionReason } from '../entities/transaction-reason.entity';

export class TransactionReasonResponseDto {
  @ApiProperty({ description: 'Transaction Reason ID' })
  id: number;

  @ApiProperty({ description: 'Reason for the transaction' })
  reason: string;

  @ApiProperty({ description: 'Transaction Type ID' })
  transactionTypeId: number;

  @ApiProperty({
    description: 'Transaction Type',
    type: TransactionTypeResponseDto,
  })
  transactionType?: TransactionTypeResponseDto;

  constructor(transactionReason: TransactionReason) {
    this.id = transactionReason.id;
    this.reason = transactionReason.reason;
    this.transactionTypeId = transactionReason.transactionTypeId;

    if (transactionReason.transactionType) {
      this.transactionType = new TransactionTypeResponseDto(
        transactionReason.transactionType,
      );
    }
  }
}
