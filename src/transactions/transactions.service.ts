import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { ethers } from 'ethers';
import { config } from 'dotenv';

config();

@Injectable()
export class TransactionsService {
  constructor(
    @InjectQueue('transactions') private readonly transactionQueue: Queue,
  ) {}
  private provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  private erc20Abi = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  private erc721Abi = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  ];

  async handleAddTransactionInQueue(): Promise<void> {
    const length = await this.provider.getBlockNumber();
    let data: any = [];
    for (let i = length - 1000; i <= length; i++) {
      const block = await this.provider.getBlock(i);
      data.push(block.transactions);
      if (data.length === 100) {
        await this.transactionQueue.add('transactionsList', data);
        data = [];
      }
    }
  }
  checkErc20(tx: any): boolean {
    if (!tx?.args) {
      return false;
    }

    const spender = tx.args[0];
    const owner = tx.args[1];
    const { value: rawAmount } = tx.args;

    if (!spender && !owner && !rawAmount) {
      return false;
    }

    return true;
  }

  checkErc721(tx: any): boolean {
    if (!tx?.args) {
      return false;
    }

    if (!tx.args.tokenId) {
      return false;
    }
    const approved = tx.args[0];
    const owner = tx.args[1];
    const tokenId = tx.args.tokenId;
    if (!approved && !owner && !tokenId) {
      return false;
    }

    return true;
  }

  async checkTransfer(transactions: string[]) {
    const erc20Interface = new ethers.Interface(this.erc20Abi);
    const erc721Interface = new ethers.Interface(this.erc721Abi);
    const txTypes = [];

    for (const tx of transactions) {
      const receipt = await this.provider.getTransactionReceipt(tx);
      let isNative = true;
      for (const log of receipt.logs) {
        try {
          const erc20ParsedLog = erc20Interface.parseLog(log);
          if (!erc20ParsedLog) {
            break;
          }

          if (
            erc20ParsedLog.name === 'Transfer' &&
            this.checkErc20(erc20ParsedLog)
          ) {
            txTypes.push({
              transaction: { log, erc20ParsedLog },
              type: 'ERC20',
            });
            isNative = false;
            continue;
          }
        } catch (err) {}
        try {
          const erc721ParsedLog = erc721Interface.parseLog(log);
          if (!erc721ParsedLog) {
            break;
          }
          if (
            erc721ParsedLog.name === 'Transfer' &&
            this.checkErc20(erc721ParsedLog)
          ) {
            txTypes.push({
              transaction: {
                log,
                erc721ParsedLog,
              },
              type: 'ERC721',
            });
            isNative = false;
            continue;
          }
        } catch (err) {}
        if (isNative) {
          txTypes.push({ transaction: log, type: 'Native' });
        }
      }
    }
    return txTypes;
  }
}
