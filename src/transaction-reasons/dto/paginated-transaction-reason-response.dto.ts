import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { TransactionReasonResponseDto } from './transaction-reason-response.dto';

export class PaginatedTransactionReasonResponseDto extends PaginationDto<TransactionReasonResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [TransactionReasonResponseDto],
  })
  declare data: TransactionReasonResponseDto[];
}
