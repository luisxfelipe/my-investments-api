import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTransactionTypeDto {
  @ApiProperty({ description: 'Name of the transaction type', required: false })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  name?: string;
}
