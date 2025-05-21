import { AssetResponseDto } from "src/assets/dto/asset-response.dto";
import { PlatformResponseDto } from "src/platforms/dto/platform-response.dto";
import { SavingsGoalResponseDto } from "src/savings-goals/dto/savings-goal-response.dto";
import { UserResponseDto } from "src/users/dto/user-response.dto";
import { Portfolio } from "../entities/portfolio.entity";
import { ApiProperty } from "@nestjs/swagger";

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

    @ApiProperty({ description: 'User', type: UserResponseDto })
    user?: UserResponseDto;

    @ApiProperty({ description: 'Asset', type: AssetResponseDto })
    asset?: AssetResponseDto;

    @ApiProperty({ description: 'Platform', type: PlatformResponseDto })
    platform?: PlatformResponseDto;

    @ApiProperty({ description: 'Savings Goal', type: SavingsGoalResponseDto })
    savingsGoal?: SavingsGoalResponseDto;

    constructor(portfolio: Portfolio) {
        this.id = portfolio.id;
        this.userId = portfolio.userId;
        this.assetId = portfolio.assetId;
        this.platformId = portfolio.platformId;
        this.savingsGoalId = portfolio.savingsGoalId;
        this.currentBalance = portfolio.currentBalance;
        this.averagePrice = portfolio.averagePrice;

        if (portfolio.user) {
            this.user = new UserResponseDto(portfolio.user);
        }

        if (portfolio.asset) {
            this.asset = new AssetResponseDto(portfolio.asset);
        }

        if (portfolio.platform) {
            this.platform = new PlatformResponseDto(portfolio.platform);
        }

        if (portfolio.savingsGoal) {
            this.savingsGoal = new SavingsGoalResponseDto(portfolio.savingsGoal);
        }
    }
}