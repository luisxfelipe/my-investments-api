import { Module, forwardRef } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { PortfoliosController } from './portfolios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { UsersModule } from 'src/users/users.module';
import { AssetsModule } from 'src/assets/assets.module';
import { PlatformsModule } from 'src/platforms/platforms.module';
import { SavingsGoalsModule } from 'src/savings-goals/savings-goals.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio]),
    UsersModule,
    AssetsModule,
    forwardRef(() => PlatformsModule),
    SavingsGoalsModule,
    forwardRef(() => TransactionsModule),
  ],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
