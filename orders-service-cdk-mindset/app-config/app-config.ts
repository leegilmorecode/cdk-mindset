import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Region, Stage } from '../types';

export interface EnvironmentConfig {
  shared: {
    stage: Stage;
    metricNamespace: string;
    dashboardName: string;
    dashboardDescription: string;
    serviceName: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
      sampleRate: string;
    };
  };
  env: {
    account: string;
    region: string;
  };
  stateless: {
    runtimes: lambda.Runtime;
  };
  stateful: {
    serviceTableName: string;
    idempotencyTableName: string;
  };
}

export const getEnvironmentConfig = (stage: Stage): EnvironmentConfig => {
  switch (stage) {
    case Stage.test:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
            sampleRate: '0',
          },
          serviceName: `cdk-mindset-order-service-${Stage.test}`,
          metricNamespace: `cdk-mindset-namespace-${Stage.test}`,
          stage: Stage.test,
          dashboardName: `custom-order-service-dashboard-${Stage.test}`,
          dashboardDescription: `Order Service Dashboard ${Stage.test}`,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789012',
          region: Region.dublin,
        },
        stateful: {
          serviceTableName: `order-service-table-${Stage.test}`,
          idempotencyTableName: `order-service-idemp-table-${Stage.test}`,
        },
      };
    case Stage.staging:
      return {
        shared: {
          logging: {
            logLevel: 'INFO',
            logEvent: 'false',
            sampleRate: '0',
          },
          serviceName: `cdk-mindset-order-service-${Stage.staging}`,
          metricNamespace: `cdk-mindset-namespace-${Stage.staging}`,
          stage: Stage.staging,
          dashboardName: `custom-order-service-dashboard-${Stage.staging}`,
          dashboardDescription: `Order Service Dashboard ${Stage.staging}`,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789012',
          region: Region.dublin,
        },
        stateful: {
          serviceTableName: `order-service-table-${Stage.staging}`,
          idempotencyTableName: `order-service-idemp-table-${Stage.staging}`,
        },
      };
    case Stage.prod:
      return {
        shared: {
          logging: {
            logLevel: 'INFO',
            logEvent: 'false',
            sampleRate: '0',
          },
          serviceName: `cdk-mindset-order-service-${Stage.prod}`,
          metricNamespace: `cdk-mindset-namespace-${Stage.prod}`,
          stage: Stage.prod,
          dashboardName: `custom-order-service-dashboard-${Stage.prod}`,
          dashboardDescription: `Order Service Dashboard ${Stage.prod}`,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789012',
          region: Region.dublin,
        },
        stateful: {
          serviceTableName: `order-service-table-${Stage.prod}`,
          idempotencyTableName: `order-service-idemp-table-${Stage.prod}`,
        },
      };
    case Stage.develop:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
            sampleRate: '0',
          },
          serviceName: `cdk-mindset-order-service-${Stage.develop}`,
          metricNamespace: `cdk-mindset-namespace-${Stage.develop}`,
          stage: Stage.develop,
          dashboardName: `custom-order-service-dashboard-${Stage.develop}`,
          dashboardDescription: `Order Service Dashboard ${Stage.develop}`,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789012',
          region: Region.dublin,
        },
        stateful: {
          serviceTableName: `order-service-table-${Stage.develop}`,
          idempotencyTableName: `order-service-idemp-table-${Stage.develop}`,
        },
      };
    default:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
            sampleRate: '0',
          },
          serviceName: `cdk-mindset-order-service-${stage}`,
          metricNamespace: `cdk-mindset-namespace-${stage}`,
          stage: stage,
          dashboardName: `custom-order-service-dashboard-${stage}`,
          dashboardDescription: `Order Service Dashboard ${stage}`,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789012',
          region: Region.dublin,
        },
        stateful: {
          serviceTableName: `order-service-table-${stage}`,
          idempotencyTableName: `order-service-idemp-table-${stage}`,
        },
      };
  }
};
