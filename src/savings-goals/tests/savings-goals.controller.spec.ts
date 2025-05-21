import { Test, TestingModule } from '@nestjs/testing';
import { SavingsGoalsController } from './savings-goals.controller';
import { SavingsGoalsService } from './savings-goals.service';

describe('SavingsGoalsController', () => {
  let controller: SavingsGoalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavingsGoalsController],
      providers: [SavingsGoalsService],
    }).compile();

    controller = module.get<SavingsGoalsController>(SavingsGoalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
