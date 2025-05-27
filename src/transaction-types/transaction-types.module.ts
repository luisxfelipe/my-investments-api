import { Module, forwardRef } from '@nestjs/common';
import { TransactionTypesService } from './transaction-types.service';
import { TransactionTypesController } from './transaction-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionType } from './entities/transaction-type.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionType]),
    forwardRef(() => TransactionsModule),
  ],
  controllers: [TransactionTypesController],
  providers: [TransactionTypesService],
  exports: [TransactionTypesService],
})
export class TransactionTypesModule {}
