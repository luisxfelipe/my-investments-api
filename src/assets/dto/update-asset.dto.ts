import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAssetDto {
  @ApiProperty({ description: 'Name of the asset', required: false })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  name?: string;

  @ApiProperty({ description: 'Code of the asset', required: false })
  @IsOptional()
  @IsString({ message: 'Code must be a string' })
  @MaxLength(20, { message: 'Code must be at most 20 characters long' })
  code?: string;

  // Campos críticos removidos para segurança:
  // - categoryId: não deve ser alterável após criação
  // - assetTypeId: não deve ser alterável após criação
  // - userId: obtido do token de autenticação
}
