import { ApiProperty } from '@nestjs/swagger';
import { Portfolio } from '../entities/portfolio.entity';
import { PortfolioResponseDto } from './portfolio-response.dto';

export class PortfolioDashboardResponseDto {
  @ApiProperty({ description: 'Portfolio', type: () => PortfolioResponseDto })
  portfolio: PortfolioResponseDto;

  @ApiProperty({
    description: 'Total number of transactions in this portfolio',
  })
  transactionCount: number;

  @ApiProperty({
    description: 'Average price of assets in this portfolio',
  })
  averagePrice: number;

  @ApiProperty({
    description: 'Current balance/total value of this portfolio',
  })
  currentBalance: number;

  @ApiProperty({ description: 'Last Update Timestamp' })
  lastUpdate: Date;

  constructor(
    portfolio: Portfolio,
    transactionCount: number = 0,
    averagePrice: number = 0,
    currentBalance: number = 0,
  ) {
    this.portfolio = new PortfolioResponseDto(portfolio);
    this.transactionCount = transactionCount;
    this.averagePrice = averagePrice;
    this.currentBalance = currentBalance;
    this.lastUpdate = new Date();
  }
}
