import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdatePortfolioDto {
  @ApiProperty({ description: 'Saving Goal ID', required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? null : Number(value),
  )
  @Type(() => Number)
  @ValidateIf((o: UpdatePortfolioDto) => o.savingGoalId !== null)
  @IsInt({ message: 'Saving Goal ID must be an integer' })
  @IsPositive({ message: 'Saving Goal ID must be a positive number' })
  savingGoalId?: number | null;

  // Campos críticos removidos para segurança:
  // - userId: não deve ser alterável após criação
  // - assetId: alteração pode quebrar histórico de transações
  // - platformId: alteração pode quebrar histórico de transações
  // - currentBalance: calculado automaticamente
  // - averagePrice: calculado automaticamente
  // - totalQuantity: calculado automaticamente
}
