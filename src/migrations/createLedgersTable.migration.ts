//
export const createLedgersTable = `
  CREATE TABLE IF NOT EXISTS ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" TEXT DEFAULT 'credit' NOT NULL,
    address TEXT NOT NULL,
    value INTEGER NOT NULL,
    block_id TEXT DEFAULT NULL,
    height INTEGER NOT NULL,
    transaction_id TEXT NOT NULL,
    index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ledgers_height ON ledgers (height);
  CREATE INDEX IF NOT EXISTS idx_ledgers_address_deleted_at ON ledgers (address, deleted_at);
`;