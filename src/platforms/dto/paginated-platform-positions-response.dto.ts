import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { PlatformPositionResponseDto } from './platform-position-response.dto';

export class PaginatedPlatformPositionsResponseDto extends PaginationDto<PlatformPositionResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [PlatformPositionResponseDto],
    description: 'List of platform investment positions with metrics',
  })
  declare data: PlatformPositionResponseDto[];
}
