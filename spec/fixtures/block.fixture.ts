import type { PoolClient } from "pg";

//
import type { IBlock } from "../../src/interfaces/block.interface";

//
export const genesisBlockFixtures: IBlock = {
  id: "2ba8bcff56711efcc564923ddb0228df08d89300b5d9b5ab776524d044841de3",
  height: 0,
  transactions: [
    {
      id: "txn1",
      inputs: [],
      outputs: [
        {
          address: "address0",
          value: 50
        }
      ]
    }
  ]
}

export const normalTransactionBlockFixtures: IBlock = {
  id: "c9fcd4498e26c12bd25e280a60fab08434eb4d5f1a6092e23c6b8b602cfb7108",
  height: 1,
  transactions: [
    {
      id: "txn2",
      inputs: [
        {
          txId: "txn1",
          index: 0
      }
      ],
      outputs: [
        {
          address: "address1",
          value: 10
        }
      ]
    }
  ]
}

export const coinbaseTransactionBlockFixtures = {
  id: "2ba8bcff56711efcc564923ddb0228df08d89300b5d9b5ab776524d044841de3",
  height: 1,
  transactions: [
    {
      id: "coinbase-txn1",
      inputs: [],
      outputs: [
        {
          address: "address1",
          value: 10
        }
      ]
    }
  ]
};