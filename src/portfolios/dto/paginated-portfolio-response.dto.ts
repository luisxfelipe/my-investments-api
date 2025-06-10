import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { PortfolioResponseDto } from './portfolio-response.dto';

export class PaginatedPortfolioResponseDto extends PaginationDto<PortfolioResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [PortfolioResponseDto],
  })
  declare data: PortfolioResponseDto[];
}
