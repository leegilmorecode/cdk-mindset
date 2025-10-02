import { getISOString, logger, schemaValidator } from '@shared';

import { upsert } from '@adapters/secondary/dynamodb-adapter';
import { config } from '@config';
import { CreateOrder } from '@dto/create-order';
import { Order } from '@dto/order';
import { schema } from '@schemas/order';
import { v4 as uuid } from 'uuid';

const tableName = config.get('tableName');

export async function createOrderUseCase(
  createOrder: CreateOrder,
): Promise<Order> {
  const orderId = uuid();

  logger.info(`creating order with id ${orderId}`);

  const createdDate = getISOString();

  const order: Order = {
    pk: `ORDER#${orderId}`,
    sk: `ORDER#${orderId}`,
    id: orderId,
    created: createdDate,
    updated: createdDate,
    status: 'PENDING',
    ...createOrder,
  };

  schemaValidator(schema, order);

  await upsert<Order>(order, tableName, order.id);

  logger.info(`order with id ${orderId} created`);

  return order;
}
