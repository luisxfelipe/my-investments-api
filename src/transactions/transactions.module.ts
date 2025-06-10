import { Module, forwardRef } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfoliosModule } from 'src/portfolios/portfolios.module';
import { TransactionTypesModule } from 'src/transaction-types/transaction-types.module';
import { TransactionReasonsModule } from 'src/transaction-reasons/transaction-reasons.module';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => PortfoliosModule),
    forwardRef(() => TransactionTypesModule),
    TransactionReasonsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
