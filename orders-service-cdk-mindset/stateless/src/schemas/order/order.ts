export const schema = {
  type: 'object',
  required: [
    'pk',
    'sk',
    'id',
    'customerId',
    'items',
    'total',
    'status',
    'created',
    'updated',
  ],
  maxProperties: 9,
  minProperties: 9,
  properties: {
    pk: { type: 'string' },
    sk: { type: 'string' },
    id: { type: 'string' },
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
    status: { type: 'string' },
    created: { type: 'string', format: 'date-time' },
    updated: { type: 'string', format: 'date-time' },
  },
};
