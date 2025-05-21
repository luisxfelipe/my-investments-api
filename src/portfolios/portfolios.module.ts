import { Module } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { PortfoliosController } from './portfolios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { UsersModule } from 'src/users/users.module';
import { AssetsModule } from 'src/assets/assets.module';
import { PlatformsModule } from 'src/platforms/platforms.module';
import { SavingsGoalsModule } from 'src/savings-goals/savings-goals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio]),
    UsersModule,
    AssetsModule,
    PlatformsModule,
    SavingsGoalsModule,
  ],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule { }
