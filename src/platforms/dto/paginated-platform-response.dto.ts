import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto, PaginationMetaDto } from "src/dtos/pagination.dto";
import { PlatformResponseDto } from "./platform-response.dto";

export class PaginatedPlatformResponseDto extends PaginationDto<PlatformResponseDto> {
    @ApiProperty({
        type: PaginationMetaDto
    })
    declare meta: PaginationMetaDto;

    @ApiProperty({
        type: [PlatformResponseDto]
    })
    declare data: PlatformResponseDto[];
}