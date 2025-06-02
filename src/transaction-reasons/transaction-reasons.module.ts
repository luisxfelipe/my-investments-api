import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TransactionReasonsService } from './transaction-reasons.service';
import { TransactionReasonsController } from './transaction-reasons.controller';
import { TransactionReason } from './entities/transaction-reason.entity';
import { TransactionType } from '../transaction-types/entities/transaction-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionReason, TransactionType]),
    JwtModule,
  ],
  controllers: [TransactionReasonsController],
  providers: [TransactionReasonsService],
  exports: [TransactionReasonsService],
})
export class TransactionReasonsModule {}
