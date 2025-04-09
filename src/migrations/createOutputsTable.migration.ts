//
export const createOutputsTable = `
  CREATE TABLE IF NOT EXISTS outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id TEXT DEFAULT NULL,
    height INTEGER NOT NULL,
    transaction_id TEXT NOT NULL,
    index INTEGER NOT NULL,
    address TEXT NOT NULL,
    value INTEGER NOT NULL,
    spent_in_transaction TEXT DEFAULT NULL,
    spent_in_height INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_outputs_height ON outputs (height);
  CREATE INDEX IF NOT EXISTS idx_outputs_spent_in_height ON outputs (spent_in_height);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_outputs_transaction_id_index_spent_in_height ON outputs (transaction_id, index, spent_in_height);
  

`;