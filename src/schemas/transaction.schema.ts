import { InputSchema } from "./input.schema";
import { OutputSchema } from "./output.schema";

//
export const TransactionSchema = {
  type: 'object',
  required: [
    'id',
    'inputs',
    'outputs',
  ],
  properties: {
    id: { type: 'string' },
    inputs: {
      type: 'array',
      items: InputSchema,
    },
    outputs: {
      type: 'array',
      items: OutputSchema,  
    },
  },
}