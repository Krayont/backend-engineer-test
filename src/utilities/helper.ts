import { createHash } from "crypto";

import type { IBlock } from "../interfaces/block.interface";

//
const hash = (string: string, algorithm: string = 'sha-256'): string => {
  //
  return createHash(algorithm).update(string).digest("hex");
}

//
export const isGenesisBlock = (block: IBlock): boolean => {
  const { height, transactions } = block;

  if (height !== 0) {
    return false;
  }

  if (transactions.length !== 1) {
    return false;
  }

  const { inputs, outputs } = transactions[0];
  return inputs.length === 0 && outputs.length === 1;
}

//
const validateBlockHeight = async (block: IBlock, currentHeight: number | null, isGenesis: boolean): Promise<boolean> => {

  if (block.height < 0) {
    return false;
  }

  const { height } = block;
  if (currentHeight === null) {
    return isGenesis;
  }
  console.log(height, currentHeight);

  return height - currentHeight === 1;
}

//
export default {
  hash,
  isGenesisBlock,
  validateBlockHeight
}