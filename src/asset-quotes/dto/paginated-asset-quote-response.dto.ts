import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto, PaginationMetaDto } from "src/dtos/pagination.dto";
import { AssetQuoteResponseDto } from "./asset-quote-response.dto";

export class PaginatedAssetQuoteResponseDto extends PaginationDto<AssetQuoteResponseDto> {
    @ApiProperty({
        type: PaginationMetaDto
    })
    declare meta: PaginationMetaDto;

    @ApiProperty({
        type: [AssetQuoteResponseDto]
    })
    declare data: AssetQuoteResponseDto[];
}