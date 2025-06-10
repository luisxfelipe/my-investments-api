import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSavingGoalDto {
  // userId removido: será obtido do token de autenticação via @UserDecorator

  @ApiProperty({ description: 'Name of the saving goal' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  name: string;

  @ApiProperty({
    description: 'Description of the saving goal',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ description: 'Target value to be reached', required: false })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Target value must be a number with up to 2 decimal places' },
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
