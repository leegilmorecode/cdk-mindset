import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import {
  createError,
  createLatency,
  errorHandler,
  getHeaders,
  logger,
  schemaValidator,
  stripInternalKeys,
} from '@shared';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { config } from '@config';
import { CreateOrder } from '@dto/create-order';
import { Order } from '@dto/order';
import { ValidationError } from '@errors/validation-error';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { createOrderUseCase } from '@use-cases/create-order';
import { schema } from './create-order.schema';

const tracer = new Tracer({});
const metrics = new Metrics({});
// note the logger is a singleton so we import from @shared/logger

// we add idempotency checks to prevent duplicate order creation within a short time window
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: config.get('idempotencyTableName'),
});

const idempotencyConfig = new IdempotencyConfig({
  expiresAfterSeconds: 30, // how long to store the idempotency record
  eventKeyJmesPath: 'body', // what the idempotency cache is based on
  useLocalCache: false, // we want to use dynamodb only
});

const stage = config.get('stage');
const latency = config.get('createLatency');
const errors = config.get('createError');

export const createOrderAdapter = async ({
  body,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('no payload body');

    const order = JSON.parse(body) as CreateOrder;

    schemaValidator(schema, order);

    // simulate 2s latency for demo purposes of x-ray which we can see in the console
    if (latency === 'true') {
      await createLatency(2);
    }

    // simulate a random error for demo purposes of x-ray and cloudwatch alarms
    if (errors === 'true') {
      await createError();
    }

    const created: Order = await createOrderUseCase(order);

    tracer.putAnnotation('SuccessfulCreateOrder', true);
    metrics.addMetric('SuccessfulCreateOrder', MetricUnit.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify(stripInternalKeys(created)),
      headers: getHeaders(stage),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    tracer.putAnnotation('SuccessfulCreateOrder', false);
    metrics.addMetric('CreateOrderError', MetricUnit.Count, 1);
    return errorHandler(error);
  }
};

export const handler = middy(createOrderAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(
    makeHandlerIdempotent({
      persistenceStore,
      config: idempotencyConfig,
    }),
  )
  .use(httpErrorHandler());
