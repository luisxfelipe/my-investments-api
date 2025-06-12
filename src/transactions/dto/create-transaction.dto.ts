import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';
import { DecimalPrecision } from '../../decorators/decimal-precision.decorator';
import { FeeType } from '../../constants/fee-types.constants';
import { IsFeeConsistent } from '../../decorators/fee-validation.decorator';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsNotEmpty({ message: 'Portfolio ID is required' })
  @IsInt({ message: 'Portfolio ID must be an integer' })
  @IsPositive({ message: 'Portfolio ID must be a positive number' })
  portfolioId: number;

  @ApiProperty({ description: 'Transaction Type ID' })
  @IsNotEmpty({ message: 'Transaction Type ID is required' })
  @IsInt({ message: 'Transaction Type ID must be an integer' })
  @IsPositive({ message: 'Transaction Type ID must be a positive number' })
  transactionTypeId: number;

  @ApiProperty({ description: 'Transaction Reason ID' })
  @IsNotEmpty({ message: 'Transaction Reason ID is required' })
  @IsInt({ message: 'Transaction Reason ID must be an integer' })
  @IsPositive({ message: 'Transaction Reason ID must be a positive number' })
  transactionReasonId: number;

  @ApiProperty({ description: 'Quantity of the asset' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be a positive number' })
  @DecimalPrecision(8, {
    message: 'Quantity cannot have more than 8 decimal places',
  })
  quantity: number;

  @ApiProperty({ description: 'Unit price of the asset' })
  @IsNotEmpty({ message: 'Unit price is required' })
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price must be zero or a positive number' })
  @DecimalPrecision(8, {
    message: 'Unit price cannot have more than 8 decimal places',
  })
  unitPrice: number;

  @ApiProperty({ description: 'Transaction date', type: Date })
  @IsNotEmpty({ message: 'Transaction date is required' })
  @IsDate({ message: 'Transaction date must be a valid date' })
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty({ description: 'Fee paid for the transaction', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @Min(0, { message: 'Fee must be zero or a positive number' })
  @DecimalPrecision(8, {
    message: 'Fee cannot have more than 8 decimal places',
  })
  @IsFeeConsistent()
  fee?: number;

  @ApiProperty({
    description: 'Fee type (required if fee is provided)',
    enum: FeeType,
    required: false,
    example: FeeType.PERCENTAGE_TARGET,
  })
  @IsOptional()
  @IsEnum(FeeType, { message: 'Fee type must be a valid fee type' })
  feeType?: FeeType;

  @ApiProperty({
    description: 'Additional notes about the transaction',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
