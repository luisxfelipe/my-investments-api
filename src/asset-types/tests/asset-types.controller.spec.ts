import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypesController } from './asset-types.controller';
import { AssetTypesService } from './asset-types.service';

describe('AssetTypesController', () => {
  let controller: AssetTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetTypesController],
      providers: [AssetTypesService],
    }).compile();

    controller = module.get<AssetTypesController>(AssetTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
