import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { DecimalPrecision } from '../../decorators/decimal-precision.decorator';

export class CreateAssetQuoteDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsNotEmpty({ message: 'Asset ID is required' })
  @IsInt({ message: 'Asset ID must be an integer' })
  @IsPositive({ message: 'Asset ID must be a positive number' })
  assetId: number;

  @ApiProperty({ description: 'Asset price' })
  @IsNotEmpty({ message: 'Asset price is required' })
  @IsNumber({}, { message: 'Asset price must be a number' })
  @IsPositive({ message: 'Asset price must be positive' })
  @DecimalPrecision(6, {
    message: 'Asset price cannot have more than 6 decimal places',
  })
  @Transform(({ value }: { value: string | number }) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) {
      throw new Error('Price must be a positive number');
    }
    return num;
  })
  price: number;

  @ApiProperty({ description: 'Quote timestamp', required: false, type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Quote timestamp must be a valid date' })
  timestamp?: Date;
}
