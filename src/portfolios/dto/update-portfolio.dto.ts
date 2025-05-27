import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdatePortfolioDto {
  @ApiProperty({ description: 'Savings Goal ID', required: false })
  @IsOptional()
  @IsInt({ message: 'Savings Goal ID must be an integer' })
  @IsPositive({ message: 'Savings Goal ID must be a positive number' })
  savingsGoalId?: number;

  // Campos críticos removidos para segurança:
  // - userId: não deve ser alterável após criação
  // - assetId: alteração pode quebrar histórico de transações
  // - platformId: alteração pode quebrar histórico de transações
  // - currentBalance: calculado automaticamente
  // - averagePrice: calculado automaticamente
  // - totalQuantity: calculado automaticamente
}
