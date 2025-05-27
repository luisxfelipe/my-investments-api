import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePlatformDto {
  @ApiProperty({ description: 'Name of the platform', required: false })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  name?: string;

  // Padrão mais seguro: definir explicitamente os campos que podem ser atualizados
  // Remove a herança de PartialType para evitar exposição de campos não intencionados
}
