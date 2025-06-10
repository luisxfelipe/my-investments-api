import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto, PaginationMetaDto } from 'src/dtos/pagination.dto';
import { SavingGoalResponseDto } from './saving-goal-response.dto';

export class PaginatedSavingGoalResponseDto extends PaginationDto<SavingGoalResponseDto> {
  @ApiProperty({
    type: PaginationMetaDto,
  })
  declare meta: PaginationMetaDto;

  @ApiProperty({
    type: [SavingGoalResponseDto],
  })
  declare data: SavingGoalResponseDto[];
}
