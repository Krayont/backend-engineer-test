import type { Pool, PoolClient } from "pg";
import Dbclient from "../utilities/database/client";
import Helper from "../utilities/helper";
import Logger from '../utilities/logger';

//
import type { IBlock } from "../interfaces/block.interface";
import type { IResponse } from "../interfaces/response.interface";
import type { IOutput } from "../interfaces/output.interface";

//
import TransactionService from "../services/transaction.service";

//
import BlockModal from "../modals/block.modal";

//
const validateBlockInformation = async (block: IBlock): Promise<IResponse<string>> => { 
  try {
    const { id, height, transactions } = block;
    let stringForHash = "";

    const isGenesis = await Helper.isGenesisBlock(block);

    // get the current height from the database
    const currentHeight = await BlockModal.getCurrentHeight(isGenesis);

    // validate block height
    if (!await Helper.validateBlockHeight(block, currentHeight, isGenesis)) {
      return {
        success: false,
        response: "Invalid height"
      }
    }
    stringForHash = height.toString();

    // Create a hashmap for all the outputs in the current block
    const utxoMap = new Map<string, IOutput>();
    for (const tx of transactions) {
      tx.outputs.forEach((output, index) => {
        const key = `${tx.id}:${index}`;
        utxoMap.set(key, output);
      });
    }
    const spentUtxo = new Set<string>();

    // validate total balance of each transaction in the block
    for(const element of transactions) {
      const isCoinbase = await TransactionService.isCoinbaseTransaction(element); 
      if (!isGenesis && !isCoinbase) {
        const isValidTransaction = await TransactionService.validateTransactionBalance(element, utxoMap, spentUtxo);
        if (!isValidTransaction.success) {
          return {
            success: false,
            response: typeof isValidTransaction?.response === 'string' ?  isValidTransaction.response : "Invalid transaction balance"
          }
        }
      }
      stringForHash = `${stringForHash}${element.id}`;
    }

    // validate block id
    const hash = Helper.hash(stringForHash, 'sha-256');
    console.log(stringForHash, hash);

    if (id !== hash) {
      return {
        success: false,
        response: "Invalid block Id"
      }
    }

    //
    return {
      success: true,
      response: "success"
    };
  } catch (error: any) {
    Logger.error(error.message ?? 'Unknown Error', error);
    return {
      success: false,
      response: error.message ?? 'Unknown error while validating block information'
    };
  }
}

//
const getCurrentHeight = async (): Promise<IResponse<string | number>> => {
  try {
    const height = await BlockModal.getCurrentHeight();
    if (height === null) {
      return {
        success: false,
        response: 'No height was found'
      }
    }

    return {
      success: true,
      response: height
    }
  } catch (error: any) {
    Logger.error(error.message ?? 'Unknown Error', error);
    return {
      success: false,
      response: error.message ?? 'Unknown error while trying to get current height'
    }
  }
}

//
const createBlock = async (block: IBlock): Promise<IResponse<string>> => {
  //
  const pool: Pool = Dbclient.get();
  // get a connection from the pool to use for db_transaction
  const client: PoolClient = await pool.connect();

  const { id: blockId, height, transactions } = block;

  //
  try {
    //
    await client.query ("BEGIN");
    await client.query(`SELECT pg_advisory_xact_lock($1)`, [parseInt(process.env.LOCK_KEY ?? "12345")]);

    for(const txn of transactions) {
      // create transactions
      const createTransactionResult = await TransactionService.createTransaction(blockId, height, txn, client);
      if (!createTransactionResult.success) {
        throw new Error(createTransactionResult.response ?? 'Failed to create transaction');
      }
    }

    // insert block
    await BlockModal.createBlock(block, client);

    await client.query("COMMIT");

    return {
      success: true,
      response: "Block Created successfully",
    }
  } catch (error: any) {
    await client.query("ROLLBACK");
    Logger.error(error.message ?? 'Unknown Error', error);
    return {
      success: false,
      response: error?.message ?? "Unknown error occurred while creating block",
    }
  } finally {
    client.release();
  }
}

//
const rollback = async (height: number): Promise<IResponse<string>> => {
  //
  const pool: Pool = Dbclient.get();
  const client: PoolClient = await pool.connect();

  try {
    //
    await client.query ("BEGIN");
    await client.query(`SELECT pg_advisory_xact_lock($1)`, [parseInt(process.env.LOCK_KEY ?? "12345")]);

    //
    const deleteTransactionResult = await TransactionService.deleteTransactions(height, client);
    if (!deleteTransactionResult.success) {
      throw new Error(deleteTransactionResult.response ?? 'Failed to delete transaction')
    }

    await BlockModal.deleteBlock(height, client);

    //
    await client.query("COMMIT");
    return {
      success: true,
      response: `Height rollback to ${height}`
    }
  } catch (error: any) {
    await client.query("ROLLBACK");
    Logger.error(error.message ?? 'Unknown Error', error);
    return {
      success: false,
      response: error?.message ?? "Unknown error occurred while creating block",
    }
  } finally {
    client.release();
  }
}

//
export default {
  validateBlockInformation,
  getCurrentHeight,
  createBlock,
  rollback,
};