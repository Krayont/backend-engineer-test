import type { ITransaction } from './transaction.interface';

//
export interface IBlock {
  id: string;
  height: number;
  transactions: ITransaction[];
}