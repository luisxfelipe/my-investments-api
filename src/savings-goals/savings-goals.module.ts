import { Module, forwardRef } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { SavingsGoalsController } from './savings-goals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingGoal } from './entities/saving-goal.entity';
import { UsersModule } from 'src/users/users.module';
import { PortfoliosModule } from 'src/portfolios/portfolios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingGoal]),
    UsersModule,
    forwardRef(() => PortfoliosModule),
  ],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
