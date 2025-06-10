import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { AssetResponseDto } from './asset-response.dto';

export class PaginatedAssetResponseDto extends PaginationDto<AssetResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [AssetResponseDto],
  })
  declare data: AssetResponseDto[];
}
