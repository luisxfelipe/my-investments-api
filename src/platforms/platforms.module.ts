import { Module, forwardRef } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Platform } from './entities/platform.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { AssetsModule } from 'src/assets/assets.module';
import { AssetQuotesModule } from 'src/asset-quotes/asset-quotes.module';
import { PortfoliosModule } from 'src/portfolios/portfolios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Platform]),
    TransactionsModule,
    AssetsModule,
    AssetQuotesModule,
    forwardRef(() => PortfoliosModule),
  ],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
