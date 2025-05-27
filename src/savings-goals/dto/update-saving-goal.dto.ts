import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDecimal,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSavingGoalDto {
  @ApiProperty({ description: 'Name of the saving goal', required: false })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  name?: string;

  @ApiProperty({
    description: 'Description of the saving goal',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ description: 'Target value to be reached', required: false })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Target value must be a decimal with up to 2 decimal places' },
  )
  targetValue?: number;

  @ApiProperty({
    description: 'Target date to reach the goal',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Target date must be a valid date' })
  @Type(() => Date)
  targetDate?: Date;
}
