import { AssetResponseDto } from 'src/assets/dto/asset-response.dto';
import { PlatformResponseDto } from 'src/platforms/dto/platform-response.dto';
import { Portfolio } from '../entities/portfolio.entity';
import { ApiProperty } from '@nestjs/swagger';
import { SavingGoalResponseDto } from 'src/savings-goals/dto/saving-goal-response.dto';

export class PortfolioResponseDto {
  @ApiProperty({ description: 'Portfolio ID' })
  id: number;

  @ApiProperty({ description: 'User ID' })
  userId: number;

  @ApiProperty({ description: 'Asset ID' })
  assetId: number;

  @ApiProperty({ description: 'Platform ID' })
  platformId: number;

  @ApiProperty({ description: 'Saving Goal ID', required: false })
  savingGoalId?: number;

  @ApiProperty({ description: 'Current Balance' })
  currentBalance: number;

  @ApiProperty({ description: 'Average Price' })
  averagePrice: number;

  @ApiProperty({ description: 'Asset', type: AssetResponseDto })
  asset?: AssetResponseDto;

  @ApiProperty({ description: 'Platform', type: PlatformResponseDto })
  platform?: PlatformResponseDto;

  @ApiProperty({ description: 'Saving Goal', type: SavingGoalResponseDto })
  savingGoal?: SavingGoalResponseDto;

  constructor(portfolio: Portfolio) {
    this.id = portfolio.id;
    this.userId = portfolio.userId;
    this.assetId = portfolio.assetId;
    this.platformId = portfolio.platformId;
    this.savingGoalId = portfolio.savingGoalId;
    this.currentBalance = portfolio.currentBalance;
    this.averagePrice = portfolio.averagePrice;

    if (portfolio.asset) {
      this.asset = new AssetResponseDto(portfolio.asset);
    }

    if (portfolio.platform) {
      this.platform = new PlatformResponseDto(portfolio.platform);
    }

    if (portfolio.savingGoal) {
      this.savingGoal = new SavingGoalResponseDto(portfolio.savingGoal);
    }
  }
}
