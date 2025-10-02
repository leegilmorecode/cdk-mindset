export const schema = {
  type: 'object',
  required: ['customerId', 'items', 'total'],
  maxProperties: 3,
  minProperties: 3,
  properties: {
    customerId: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          price: { type: 'number' },
        },
      },
    },
    total: { type: 'number' },
  },
};
