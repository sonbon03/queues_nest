import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { BullModule } from '@nestjs/bull';
import { TransactionScanCheck } from './transactions.process';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/transaction.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transactions',
    }),
    TypeOrmModule.forFeature([TransactionEntity]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionScanCheck],
})
export class TransactionsModule {}
