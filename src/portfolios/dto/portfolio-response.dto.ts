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

  @ApiProperty({ description: 'Savings Goal ID', required: false })
  savingsGoalId?: number;

  @ApiProperty({ description: 'Current Balance' })
  currentBalance: number;

  @ApiProperty({ description: 'Average Price' })
  averagePrice: number;

  @ApiProperty({ description: 'Asset', type: AssetResponseDto })
  asset?: AssetResponseDto;

  @ApiProperty({ description: 'Platform', type: PlatformResponseDto })
  platform?: PlatformResponseDto;

  @ApiProperty({ description: 'Savings Goal', type: SavingGoalResponseDto })
  savingsGoal?: SavingGoalResponseDto;

  constructor(portfolio: Portfolio) {
    this.id = portfolio.id;
    this.userId = portfolio.userId;
    this.assetId = portfolio.assetId;
    this.platformId = portfolio.platformId;
    this.savingsGoalId = portfolio.savingsGoalId;
    this.currentBalance = portfolio.currentBalance;
    this.averagePrice = portfolio.averagePrice;

    if (portfolio.asset) {
      this.asset = new AssetResponseDto(portfolio.asset);
    }

    if (portfolio.platform) {
      this.platform = new PlatformResponseDto(portfolio.platform);
    }

    if (portfolio.savingGoal) {
      this.savingsGoal = new SavingGoalResponseDto(portfolio.savingGoal);
    }
  }
}
