import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateAssetQuoteDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsNotEmpty({ message: 'Asset ID is required' })
  @IsInt({ message: 'Asset ID must be an integer' })
  @IsPositive({ message: 'Asset ID must be a positive number' })
  assetId: number;

  @ApiProperty({ description: 'Asset price' })
  @IsNotEmpty({ message: 'Asset price is required' })
  @IsString({ message: 'Asset price must be a string' })
  price: string;

  @ApiProperty({ description: 'Quote timestamp', required: false, type: Date })
  @Type(() => Date)
  @IsDate({ message: 'Quote timestamp must be a valid date' })
  timestamp?: Date;
}
