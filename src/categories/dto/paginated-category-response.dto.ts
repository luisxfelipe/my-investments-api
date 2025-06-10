import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { CategoryResponseDto } from './category-response.dto';

export class PaginatedCategoryResponseDto extends PaginationDto<CategoryResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [CategoryResponseDto],
  })
  declare data: CategoryResponseDto[];
}
