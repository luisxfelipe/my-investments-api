import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '../entities/asset-type.entity';

export class AssetTypeResponseDto {
  @ApiProperty({ description: 'Asset Type ID' })
  id: number;

  @ApiProperty({ description: 'Asset Type Name' })
  name: string;

  constructor(assetType: AssetType) {
    this.id = assetType.id;
    this.name = assetType.name;
  }
}
