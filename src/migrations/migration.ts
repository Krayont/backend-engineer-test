//
import type { Pool } from 'pg';

//
import { createBlocksTable } from "./createBlocksTable.migration";
import { createTransactionsTable } from "./createTransactionsTable.migration";
import { createOutputsTable } from "./createOutputsTable.migration";
import { createInputsTable } from './createInputTable.migration';
import { createLedgersTable } from "./createLedgersTable.migration";

const migrations = [
  createBlocksTable,
  createTransactionsTable,
  createInputsTable,
  createOutputsTable,
  createLedgersTable,
];

import dbClient from '../utilities/database/client';
import Logger from '../utilities/logger';

//
const run = async () => {
  //
  const pool = dbClient.get();
  try {
    for (const query of migrations) {
      await pool.query(query);
      Logger.info(`Migration executed: ${query}`);
    }
    Logger.info('All migrations executed successfully.');
  } catch (error) {
    Logger.error('Error while running migrations:', error);
    throw error;
  } 
}

export default {
  run
}