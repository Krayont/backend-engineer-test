//
export const InputSchema = {
  type: 'object',
  required: [
    'txId',
    'index',
  ],
  properties: {
    txId: { type: 'string' },
    index: { type: 'integer', minimum: 0 },
  },
}