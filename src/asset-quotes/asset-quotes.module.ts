import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetQuote } from './entities/asset-quote.entity';
import { AssetQuotesService } from './asset-quotes.service';
import { AssetQuotesController } from './asset-quotes.controller';
import { AssetsModule } from 'src/assets/assets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetQuote]),
    forwardRef(() => AssetsModule),
  ],
  controllers: [AssetQuotesController],
  providers: [AssetQuotesService],
  exports: [AssetQuotesService],
})
export class AssetQuotesModule {}
