import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from 'src/categories/categories.module';
import { AssetTypesModule } from 'src/asset-types/asset-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]),
    CategoriesModule,
    AssetTypesModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
