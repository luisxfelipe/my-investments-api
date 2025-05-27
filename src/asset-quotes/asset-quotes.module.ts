import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetQuote } from './entities/asset-quote.entity';
import { AssetQuotesService } from './asset-quotes.service';
import { AssetQuotesController } from './asset-quotes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AssetQuote])],
  controllers: [AssetQuotesController],
  providers: [AssetQuotesService],
  exports: [AssetQuotesService],
})
export class AssetQuotesModule {}
