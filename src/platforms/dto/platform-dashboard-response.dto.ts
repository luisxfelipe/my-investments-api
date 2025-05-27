import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '../entities/platform.entity';
import { PlatformResponseDto } from './platform-response.dto';

export class PlatformDashboardResponseDto {
  @ApiProperty({ description: 'Platform', type: () => PlatformResponseDto })
  platform: PlatformResponseDto;

  @ApiProperty({ description: 'Total Amount Invested' })
  totalAmountInvested: number;

  @ApiProperty({ description: 'Current Market Value' })
  currentMarketValue: number;

  @ApiProperty({
    description:
      'Total Return Percentage since first investment (as percentage, e.g., 10 for 10%)',
  })
  totalReturnPercentage: number;

  @ApiProperty({ description: 'Number of Different Assets' })
  assetCount: number;

  @ApiProperty({ description: 'Last Update Timestamp' })
  lastUpdate: Date;

  constructor(
    platform: Platform,
    totalAmountInvested: number = 0,
    currentMarketValue: number = 0,
    totalReturnPercentage: number = 0,
    assetCount: number = 0,
  ) {
    this.platform = new PlatformResponseDto(platform);
    this.totalAmountInvested = totalAmountInvested;
    this.currentMarketValue = currentMarketValue;
    this.totalReturnPercentage = totalReturnPercentage;
    this.assetCount = assetCount;
    this.lastUpdate = new Date();
  }
}
