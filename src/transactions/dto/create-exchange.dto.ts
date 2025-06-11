import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateExchangeDto {
  @ApiProperty({
    description: 'Source portfolio ID (asset being sold)',
    example: 1,
  })
  @IsNumber({}, { message: 'Source portfolio ID must be a number' })
  @IsPositive({ message: 'Source portfolio ID must be positive' })
  sourcePortfolioId: number;

  @ApiProperty({
    description: 'Target portfolio ID (asset being bought)',
    example: 2,
  })
  @IsNumber({}, { message: 'Target portfolio ID must be a number' })
  @IsPositive({ message: 'Target portfolio ID must be positive' })
  targetPortfolioId: number;

  @ApiProperty({
    description: 'Quantity of source asset to sell',
    example: 50000,
  })
  @IsNumber({}, { message: 'Source quantity must be a number' })
  @IsPositive({ message: 'Source quantity must be positive' })
  sourceQuantity: number;

  @ApiProperty({
    description: 'Quantity of target asset to buy',
    example: 1,
  })
  @IsNumber({}, { message: 'Target quantity must be a number' })
  @IsPositive({ message: 'Target quantity must be positive' })
  targetQuantity: number;

  @ApiProperty({
    description: 'Exchange rate (target units per source unit)',
    example: 0.00002,
    type: 'number',
  })
  @IsNumber({}, { message: 'Exchange rate must be a number' })
  @IsPositive({ message: 'Exchange rate must be positive' })
  exchangeRate: number;

  @ApiProperty({
    description: 'Transaction date',
    type: Date,
    example: '2024-12-10T10:00:00.000Z',
  })
  @IsDate({ message: 'Transaction date must be a valid date' })
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty({
    description: 'Exchange fee (applied to sell transaction)',
    required: false,
    example: 10.5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @Min(0, { message: 'Fee must be zero or positive' })
  fee?: number;

  @ApiProperty({
    description: 'Additional notes about the exchange',
    required: false,
    example: 'BTC purchase for portfolio diversification',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
