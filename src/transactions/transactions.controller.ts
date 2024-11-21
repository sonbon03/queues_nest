import { Controller, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('queues')
  async handleAddTransactionInQueue() {
    await this.transactionsService.handleAddTransactionInQueue();
  }
}
