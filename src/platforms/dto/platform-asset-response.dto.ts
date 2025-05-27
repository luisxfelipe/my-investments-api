import { ApiProperty } from '@nestjs/swagger';
import { AssetTypeResponseDto } from '../../asset-types/dto/asset-type-response.dto';

export class PlatformAssetResponseDto {
  @ApiProperty({ description: 'Asset Code' })
  code: string;

  @ApiProperty({ description: 'Asset Type', type: () => AssetTypeResponseDto })
  type: AssetTypeResponseDto;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Average Purchase Price' })
  averagePurchasePrice: number;

  @ApiProperty({ description: 'Latest Market Price' })
  latestMarketPrice: number;

  @ApiProperty({
    description:
      'Price Change Percentage vs Average Purchase Price (as percentage, e.g., 10 for 10%, -5.5 for -5.5%)',
  })
  priceChangePercentage: number;

  @ApiProperty({ description: 'Total Market Value' })
  totalMarketValue: number;

  constructor(partial: {
    code: string;
    type: AssetTypeResponseDto;
    quantity: number;
    averagePurchasePrice: number;
    latestMarketPrice: number;
    priceChangePercentage: number;
    totalMarketValue: number;
  }) {
    this.code = partial.code;
    this.type = partial.type;
    this.quantity = partial.quantity;
    this.averagePurchasePrice = partial.averagePurchasePrice;
    this.latestMarketPrice = partial.latestMarketPrice;
    this.priceChangePercentage = partial.priceChangePercentage;
    this.totalMarketValue = partial.totalMarketValue;
  }
}
