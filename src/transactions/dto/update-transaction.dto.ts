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

export class UpdateTransactionDto {
  @ApiProperty({ description: 'Quantity of the asset', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be a positive number' })
  quantity?: number;

  @ApiProperty({ description: 'Unit price of the asset', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price must be zero or a positive number' })
  unitPrice?: number;

  @ApiProperty({ description: 'Transaction date', required: false, type: Date })
  @IsOptional()
  @IsDate({ message: 'Transaction date must be a valid date' })
  @Type(() => Date)
  transactionDate?: Date;

  @ApiProperty({ description: 'Fee paid for the transaction', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @Min(0, { message: 'Fee must be zero or a positive number' })
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
