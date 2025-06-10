import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DecimalPrecision } from '../../decorators/decimal-precision.decorator';

export class CreateTransferDto {
  @ApiProperty({
    description: 'Source portfolio ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  sourcePortfolioId: number;

  @ApiProperty({
    description: 'Target portfolio ID',
    example: 2,
  })
  @IsInt()
  @IsNotEmpty()
  targetPortfolioId: number;

  @ApiProperty({
    description: 'Quantity to transfer',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @DecimalPrecision(8, {
    message: 'Quantity cannot have more than 8 decimal places',
  })
  quantity: number;

  @ApiProperty({
    description:
      'Unit price (required for non-currency assets, optional for currencies)',
    example: 50.25,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price must be zero or positive' })
  @DecimalPrecision(8, {
    message: 'Unit price cannot have more than 8 decimal places',
  })
  unitPrice?: number;

  @ApiProperty({
    description: 'Transfer date',
    example: '2022-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  transactionDate: Date;

  @ApiProperty({
    description: 'Transfer fee (optional)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @Min(0, { message: 'Fee must be zero or positive' })
  @DecimalPrecision(8, {
    message: 'Fee cannot have more than 8 decimal places',
  })
  fee?: number;

  @ApiProperty({
    description: 'Notes (optional)',
    example: 'Transfer between accounts',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must be at most 500 characters' })
  notes?: string;
}
