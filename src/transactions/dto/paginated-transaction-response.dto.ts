import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto, PaginationMetaDto } from "src/dtos/pagination.dto";
import { TransactionResponseDto } from "./transaction-response.dto";

export class PaginatedTransactionResponseDto extends PaginationDto<TransactionResponseDto> {
    @ApiProperty({
        type: PaginationMetaDto
    })
    declare meta: PaginationMetaDto;

    @ApiProperty({
        type: [TransactionResponseDto]
    })
    declare data: TransactionResponseDto[];
}