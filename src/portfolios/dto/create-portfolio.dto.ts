import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class CreatePortfolioDto {
  @ApiProperty({ description: 'User ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsInt({ message: 'User ID must be an integer' })
  @IsPositive({ message: 'User ID must be a positive number' })
  userId: number;

  @ApiProperty({ description: 'Asset ID' })
  @IsNotEmpty({ message: 'Asset ID is required' })
  @IsInt({ message: 'Asset ID must be an integer' })
  @IsPositive({ message: 'Asset ID must be a positive number' })
  assetId: number;

  @ApiProperty({ description: 'Platform ID' })
  @IsNotEmpty({ message: 'Platform ID is required' })
  @IsInt({ message: 'Platform ID must be an integer' })
  @IsPositive({ message: 'Platform ID must be a positive number' })
  platformId: number;
  @ApiProperty({ description: 'Savings Goal ID', required: false })
  @IsOptional()
  @IsInt({ message: 'Savings Goal ID must be an integer' })
  @IsPositive({ message: 'Savings Goal ID must be a positive number' })
  savingsGoalId?: number;
}
