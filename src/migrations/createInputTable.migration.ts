//
export const createInputsTable = `
  CREATE TABLE IF NOT EXISTS inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id TEXT DEFAULT NULL,
    height INTEGER NOT NULL,
    transaction_id TEXT NOT NULL,
    referenced_transaction_id TEXT NOT NULL,
    referenced_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_inputs_height ON inputs (height);
`;