import { ApiProperty } from "@nestjs/swagger";
import { AssetQuote } from "../entities/asset-quote.entity";

export class AssetQuoteResponseDto {
    @ApiProperty({ description: 'Quote ID' })
    id: number;

    @ApiProperty({ description: 'Asset ID' })
    assetId: number;

    @ApiProperty({ description: 'Asset price' })
    price: string;

    @ApiProperty({ description: 'Quote timestamp' })
    timestamp: Date;

    constructor(assetQuote: AssetQuote) {
        this.id = assetQuote.id;
        this.assetId = assetQuote.assetId;
        this.price = assetQuote.price;
        this.timestamp = assetQuote.timestamp;
    }
}