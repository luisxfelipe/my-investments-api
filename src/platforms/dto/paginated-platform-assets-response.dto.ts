import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { PlatformAssetResponseDto } from './platform-asset-response.dto';

export class PaginatedPlatformAssetsResponseDto extends PaginationDto<PlatformAssetResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [PlatformAssetResponseDto],
  })
  declare data: PlatformAssetResponseDto[];
}
