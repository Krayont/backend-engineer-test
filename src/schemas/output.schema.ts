//
export const OutputSchema = {
  type: 'object',
  required: [
    'address',
    'value',
  ],
  properties: {
    address: { type: 'string' },
    value: { type: 'integer', minimum: 0 },
  },
}