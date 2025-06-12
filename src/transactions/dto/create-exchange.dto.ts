import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';
import { FeeType } from '../../constants/fee-types.constants';
import { IsFeeConsistent } from '../../decorators/fee-validation.decorator';

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
    description:
      'Total amount deducted from source portfolio (what you actually paid)',
    example: 50020,
  })
  @IsNumber({}, { message: 'Source amount spent must be a number' })
  @IsPositive({ message: 'Source amount spent must be positive' })
  sourceAmountSpent: number;

  @ApiProperty({
    description:
      'Actual amount received in target portfolio (what you actually got)',
    example: 0.999,
  })
  @IsNumber({}, { message: 'Target amount received must be a number' })
  @IsPositive({ message: 'Target amount received must be positive' })
  targetAmountReceived: number;

  @ApiProperty({
    description: 'Transaction date',
    type: Date,
    example: '2024-12-10T10:00:00.000Z',
  })
  @IsDate({ message: 'Transaction date must be a valid date' })
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty({
    description: 'Fee amount (required if feeType is provided)',
    required: false,
    example: 0.1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Fee amount must be a number' })
  @Min(0, { message: 'Fee amount must be zero or positive' })
  @IsFeeConsistent()
  feeAmount?: number;

  @ApiProperty({
    description: 'Fee type (required if feeAmount is provided)',
    enum: FeeType,
    required: false,
    example: FeeType.PERCENTAGE_TARGET,
  })
  @IsOptional()
  @IsEnum(FeeType, { message: 'Fee type must be a valid fee type' })
  feeType?: FeeType;

  @ApiProperty({
    description: 'Additional notes about the exchange',
    required: false,
    example: 'BTC purchase for portfolio diversification',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
