import { ApiProperty } from "@nestjs/swagger";
import { AssetTypeResponseDto } from "src/asset-types/dto/asset-type-response.dto";
import { CategoryResponseDto } from "src/categories/dto/category-response.dto";
import { PlatformResponseDto } from "src/platforms/dto/platform-response.dto";
import { Asset } from "../entities/asset.entity";

export class AssetResponseDto {
    @ApiProperty({ description: 'Asset ID' })
    id: number;

    @ApiProperty({ description: 'Asset Name' })
    name: string;

    @ApiProperty({ description: 'Asset Code', required: false })
    code?: string;

    @ApiProperty({ description: 'Category ID' })
    categoryId: number;

    @ApiProperty({ description: 'Asset Type ID' })
    assetTypeId: number;

    @ApiProperty({ description: 'Category', type: CategoryResponseDto })
    category?: CategoryResponseDto;

    @ApiProperty({ description: 'Asset Type', type: AssetTypeResponseDto })
    assetType?: AssetTypeResponseDto;

    @ApiProperty({ description: 'Platform', type: PlatformResponseDto })
    platform?: PlatformResponseDto;

    constructor(asset: Asset) {
        this.id = asset.id;
        this.name = asset.name;
        this.code = asset.code;
        this.categoryId = asset.categoryId;
        this.assetTypeId = asset.assetTypeId;

        if (asset.category) {
            this.category = new CategoryResponseDto(asset.category);
        }

        if (asset.assetType) {
            this.assetType = new AssetTypeResponseDto(asset.assetType);
        }
    }
}