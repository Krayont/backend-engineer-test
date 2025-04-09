import type { PoolClient } from "pg";

//
export const ledgerFixtures = {
  mockOutput: {
    address: "test-address",
    value: 1000,
  },
  blockId: "block-id",
  height: 1,
  txId: "tx-id",
  txIndex: 0,
  mockClient: {} as PoolClient,
};