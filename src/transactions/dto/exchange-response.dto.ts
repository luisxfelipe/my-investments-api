import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';

export class ExchangeResponseDto {
  @ApiProperty({
    description: 'The sell transaction (source asset)',
    type: TransactionResponseDto,
  })
  sellTransaction: TransactionResponseDto;

  @ApiProperty({
    description: 'The buy transaction (target asset)',
    type: TransactionResponseDto,
  })
  buyTransaction: TransactionResponseDto;

  constructor(data: { sellTransaction: any; buyTransaction: any }) {
    this.sellTransaction = new TransactionResponseDto(data.sellTransaction);
    this.buyTransaction = new TransactionResponseDto(data.buyTransaction);
  }
}
