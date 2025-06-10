import { ApiProperty } from '@nestjs/swagger';
import { PlatformDashboardResponseDto } from './platform-dashboard-response.dto';
import { PaginationMetaDto } from '../../dtos/pagination.dto';

export class PaginatedPlatformDashboardResponseDto {
  @ApiProperty({
    description: 'Array of platform dashboards',
    type: [PlatformDashboardResponseDto],
  })
  data: PlatformDashboardResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  constructor(
    data: PlatformDashboardResponseDto[],
    totalItems: number,
    itemsPerPage: number,
    currentPage: number,
  ) {
    this.data = data;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    this.meta = new PaginationMetaDto(
      itemsPerPage,
      totalItems,
      currentPage,
      totalPages,
    );
  }
}
