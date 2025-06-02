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
} from 'class-validator';

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

  @ApiProperty({ description: 'Quantity of the asset' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be a positive number' })
  quantity: number;

  @ApiProperty({ description: 'Unit price of the asset' })
  @IsNotEmpty({ message: 'Unit price is required' })
  @IsNumber({}, { message: 'Unit price must be a number' })
  @IsPositive({ message: 'Unit price must be a positive number' })
  unitPrice: number;

  @ApiProperty({ description: 'Transaction date', type: Date })
  @IsNotEmpty({ message: 'Transaction date is required' })
  @IsDate({ message: 'Transaction date must be a valid date' })
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty({ description: 'Fee paid for the transaction', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Fee must be a number' })
  @IsPositive({ message: 'Fee must be a positive number' })
  fee?: number;

  @ApiProperty({
    description: 'Additional notes about the transaction',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
