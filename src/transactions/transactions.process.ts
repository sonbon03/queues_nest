import {
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

@Injectable()
@Processor('transactions')
export class TransactionScanCheck {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Process('transactionsList')
  async processTransactionsList(job: Job) {
    for (const tx of job.data) {
      const typeTransaction = await this.transactionsService.checkTransfer(tx);
      if (!typeTransaction[0]) {
        continue;
      }

      if (!typeTransaction[0].transaction.erc721ParsedLog) {
        await this.transactionsRepository.save({
          id: typeTransaction[0].transaction.log.transactionHash,
          type: 'Native',
        });
        continue;
      }

      if (typeTransaction[0].type === 'ERC20') {
        await this.transactionsRepository.save({
          id: typeTransaction[0].transaction.log.transactionHash,
          type: 'ERC20',
          owner: typeTransaction[0].transaction.erc721ParsedLog.args[1],
          spender: typeTransaction[0].transaction.erc721ParsedLog.args[0],
          value: typeTransaction[0].transaction.erc721ParsedLog.args.value,
        });
        continue;
      }
      if (typeTransaction[0].type === 'ERC721') {
        await this.transactionsRepository.save({
          id: typeTransaction[0].transaction.log.transactionHash,
          type: 'ERC721',
          owner: typeTransaction[0].transaction.erc721ParsedLog.args[1],
          approved: typeTransaction[0].transaction.erc721ParsedLog.args[0],
          tokenId: typeTransaction[0].transaction.erc721ParsedLog.args.tokenId,
        });
        continue;
      }
    }
  }

  @OnQueueCompleted()
  handleCompleted(job: Job) {
    console.log(
      `Job ${job.id} has completed successfully with result:`,
      job.returnvalue,
    );
  }

  @OnQueueFailed()
  handleFailed(job: Job) {
    console.log(`Job ${job.id} failed with error:`, job.failedReason);
  }
}
