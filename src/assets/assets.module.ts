import { Module, forwardRef } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from 'src/categories/categories.module';
import { AssetTypesModule } from 'src/asset-types/asset-types.module';
import { PortfoliosModule } from 'src/portfolios/portfolios.module';
import { AssetQuotesModule } from 'src/asset-quotes/asset-quotes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]),
    CategoriesModule,
    AssetTypesModule,
    forwardRef(() => PortfoliosModule),
    forwardRef(() => AssetQuotesModule),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
