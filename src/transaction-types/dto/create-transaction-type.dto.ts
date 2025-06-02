import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTransactionTypeDto {
  @ApiProperty({ description: 'Type of the transaction' })
  @IsNotEmpty({ message: 'Type is required' })
  @IsString({ message: 'Type must be a string' })
  @MaxLength(50, { message: 'Type must be at most 50 characters long' })
  type: string;
}
