import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateTransactionDto {
  @ApiProperty({ description: 'Portfolio ID', required: false })
  @IsOptional()
  @IsInt({ message: 'Portfolio ID must be an integer' })
  @IsPositive({ message: 'Portfolio ID must be a positive number' })
  portfolioId?: number;

  @ApiProperty({ description: 'Transaction Type ID', required: false })
  @IsOptional()
  @IsInt({ message: 'Transaction Type ID must be an integer' })
  @IsPositive({ message: 'Transaction Type ID must be a positive number' })
  transactionTypeId?: number;

  @ApiProperty({ description: 'Quantity of the asset', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be a positive number' })
  @Transform(({ value }: { value: string | number | undefined }) => {
    if (value === undefined || value === null) return undefined;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    return num;
  })
  quantity?: number;

  @ApiProperty({ description: 'Unit price of the asset', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Unit price must be a number' })
  @IsPositive({ message: 'Unit price must be a positive number' })
  @Transform(({ value }: { value: string | number | undefined }) => {
    if (value === undefined || value === null) return undefined;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) {
      throw new Error('Unit price must be a positive number');
    }
    return num;
  })
  unitPrice?: number;

  @ApiProperty({
    description: 'Total value of the transaction',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Total value must be a number' })
  @IsPositive({ message: 'Total value must be a positive number' })
  @Transform(({ value }: { value: string | number | undefined }) => {
    if (value === undefined || value === null) return undefined;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) {
      throw new Error('Total value must be a positive number');
    }
    return num;
  })
  totalValue?: number;

  @ApiProperty({ description: 'Transaction date', required: false, type: Date })
  @IsOptional()
  @IsDate({ message: 'Transaction date must be a valid date' })
  @Type(() => Date)
  transactionDate?: Date;

  @ApiProperty({ description: 'Fee paid for the transaction', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @IsPositive({ message: 'Fee must be a positive number' })
  @Transform(({ value }: { value: string | number | undefined }) => {
    if (value === undefined || value === null) return undefined;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num < 0) {
      throw new Error('Fee must be a non-negative number');
    }
    return num;
  })
  fee?: number;

  @ApiProperty({
    description: 'Additional notes about the transaction',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
