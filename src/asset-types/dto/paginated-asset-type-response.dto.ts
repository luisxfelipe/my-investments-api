import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { AssetTypeResponseDto } from './asset-type-response.dto';

export class PaginatedAssetTypeResponseDto extends PaginationDto<AssetTypeResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [AssetTypeResponseDto],
  })
  declare data: AssetTypeResponseDto[];
}
