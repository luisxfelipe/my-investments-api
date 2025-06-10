import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';

export class TransferResponseDto {
  @ApiProperty({
    description: 'Outgoing transaction in the source portfolio',
    type: () => TransactionResponseDto,
  })
  sourceTransaction: TransactionResponseDto;

  @ApiProperty({
    description: 'Incoming transaction in the target portfolio',
    type: () => TransactionResponseDto,
  })
  targetTransaction: TransactionResponseDto;
}
