import { TransactionSchema } from "./transaction.schema";

//
export const BlockSchema = {
  type: 'object',
  required: [
    'id',
    'height', 
    'transactions'
  ],
  properties: {
    id: { type: 'string' },
    height: { type: 'integer', minimum: 0 },
    transactions: {
      type: 'array',
      items: TransactionSchema,
    },
  },
};