import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePortfolioDto {
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

  @ApiProperty({ description: 'Saving Goal ID', required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? null : Number(value),
  )
  @Type(() => Number)
  @ValidateIf((o: CreatePortfolioDto) => o.savingGoalId !== null)
  @IsInt({ message: 'Saving Goal ID must be an integer' })
  @IsPositive({ message: 'Saving Goal ID must be a positive number' })
  savingGoalId?: number | null;

  // userId removido - será obtido do usuário autenticado
}
