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
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'Amount to transfer',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Transfer date',
    example: '2022-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  transactionDate: Date;

  @ApiProperty({
    description: 'Fee (optional)',
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  fee?: number;

  @ApiProperty({
    description: 'Notes (optional)',
    example: 'Transfer between accounts',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
