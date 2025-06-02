import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTransactionTypeDto {
  @ApiProperty({ description: 'Type of the transaction', required: false })
  @IsOptional()
  @IsString({ message: 'Type must be a string' })
  @MaxLength(50, { message: 'Type must be at most 50 characters long' })
  type?: string;
}
