import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/assets/dto/asset-response.dto';
import { AssetQuote } from '../entities/asset-quote.entity';

export class AssetQuoteResponseDto {
  @ApiProperty({ description: 'Quote ID' })
  id: number;

  @ApiProperty({ description: 'Asset ID' })
  assetId: number;

  @ApiProperty({ description: 'Asset price' })
  price: number;

  @ApiProperty({ description: 'Quote timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Asset', type: AssetResponseDto })
  asset?: AssetResponseDto;

  constructor(assetQuote: AssetQuote) {
    this.id = assetQuote.id;
    this.assetId = assetQuote.assetId;
    this.price = assetQuote.price;
    this.timestamp = assetQuote.timestamp;

    if (assetQuote.asset) {
      this.asset = new AssetResponseDto(assetQuote.asset);
    }
  }
}
