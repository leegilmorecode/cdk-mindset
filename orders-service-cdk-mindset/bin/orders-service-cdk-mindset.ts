#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { getEnvironmentConfig } from '../app-config';
import { OrdersServiceCdkMindsetStatefulStack } from '../stateful/stateful';
import { OrdersServiceCdkMindsetStatelessStack } from '../stateless/stateless';
import type { Stage } from '../types';
import { getStage } from '../utils';

const stage = getStage(process.env.STAGE as Stage) as Stage;
const appConfig = getEnvironmentConfig(stage);

const app = new cdk.App();

const statefulStack = new OrdersServiceCdkMindsetStatefulStack(
  app,
  `OrdersServiceCdkMindsetStatefulStack${stage}`,
  {
    env: appConfig.env,
    stateful: appConfig.stateful,
    shared: appConfig.shared,
    stackName: `order-service-${stage}-stateful`,
    dashboardName: `${appConfig.shared.dashboardName}-stateful`,
    dashboardDescription: `${appConfig.shared.dashboardDescription} - stateful`,
    createDashboard: false, // we dont want to create a custom dashboard for the stateful stack
  },
);

new OrdersServiceCdkMindsetStatelessStack(
  app,
  `OrdersServiceCdkMindsetStatelessStack${stage}`,
  {
    env: appConfig.env,
    stateless: appConfig.stateless,
    shared: appConfig.shared,
    serviceTable: statefulStack.serviceTable,
    idempotencyTable: statefulStack.idempotencyTable,
    stackName: `order-service-${stage}-stateless`,
    dashboardName: `${appConfig.shared.dashboardName}-stateless`,
    dashboardDescription: `${appConfig.shared.dashboardDescription} - stateless`,
    createDashboard: true, // we do want to create a custom dashboard for the stateless stack
  },
);
