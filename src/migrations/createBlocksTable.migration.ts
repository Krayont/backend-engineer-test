//
export const createBlocksTable = `
  CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY DEFAULT NULL,
    height INTEGER NOT NULL, 
    is_tip BOOLEAN DEFAULT true,
    raw JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks (height);
  CREATE INDEX IF NOT EXISTS idx_blocks_is_tip ON blocks (is_tip);
  CREATE INDEX IF NOT EXISTS idx_blocks_deleted_at ON blocks (deleted_at);
`;