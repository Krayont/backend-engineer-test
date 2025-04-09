//
export const createTransactionsTable = `
  CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    txId TEXT DEFAULT NULL,
    block_id TEXT DEFAULT NULL,
    height INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_height ON transactions (height);
  CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions (deleted_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_txId_unique ON transactions (txId) WHERE deleted_at IS NULL;
`;