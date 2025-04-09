import type { IInput } from './input.interface';
import type { IOutput } from './output.interface';

//
export interface ITransaction {
  id: string;
  inputs: IInput[];
  outputs: IOutput[];
}