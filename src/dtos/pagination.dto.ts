import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total items',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total pages',
    example: 10,
  })
  totalPages: number;

  constructor(
    itemsPerPage: number,
    totalItems: number,
    currentPage: number,
    totalPages: number,
  ) {
    this.itemsPerPage = itemsPerPage;
    this.totalItems = totalItems;
    this.currentPage = currentPage;
    this.totalPages = totalPages;
  }
}

export class PaginationDto<T> {
  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiProperty({
    description: 'Paged data',
    isArray: true,
  })
  data: T[];

  constructor(pagationMega: PaginationMetaDto, data: T[]) {
    this.meta = pagationMega;
    this.data = data;
  }
}
