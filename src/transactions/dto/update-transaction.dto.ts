import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
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
  fee?: number;

  @ApiProperty({
    description: 'Additional notes about the transaction',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
