import type { PoolClient } from "pg"

//
import type { IInput } from "../interfaces/input.interface"

//
const createInput = async (blockId: string, height: number, txId: string, input: IInput, client: PoolClient): Promise<void> => {
  const query = `
    INSERT INTO inputs (transaction_id, referenced_transaction_id, referenced_index, block_id, height)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const params = [
    txId,
    input.txId,
    input.index,
    blockId,
    height
  ];

  const res = await client.query(query, params);

  if (res.rowCount === 0) {
    throw new Error("Unable to create Input")
  }
}

//
const deleteInputs = async (height: number, client: PoolClient): Promise<void> => {
  const query = `
    DELETE 
    FROM inputs
    WHERE
      height > $1
  `
  const result = await client.query(query, [height]);
  if (result.rowCount === 0) {
    throw new Error("Unable to delete Inputs")
  }
}

//
export default {
  createInput,
  deleteInputs
}