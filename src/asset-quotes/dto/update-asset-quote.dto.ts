import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsNumber, IsPositive } from 'class-validator';

export class UpdateAssetQuoteDto {
  @ApiProperty({ description: 'Asset price', required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be positive' })
  @Transform(({ value }: { value?: string | number }) => {
    if (value !== undefined && value !== null) {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num) || num <= 0) {
        throw new Error('Price must be a positive number');
      }
      return num;
    }
    return undefined;
  })
  price?: number;
}
