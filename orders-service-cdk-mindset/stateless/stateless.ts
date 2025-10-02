import * as apigw from 'aws-cdk-lib/aws-apigateway';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'node:path';

import { Aspects, Duration } from 'aws-cdk-lib';
import {
  MonitoringFacade,
  SnsAlarmActionStrategy,
} from 'cdk-monitoring-constructs';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import {
  CustomStack,
  CustomStackProps,
  LambdaFunction,
  RestApi,
} from '../app-constructs';
import { RequiredTagsChecker, Tags, addTagsToStack } from '../aspects';
import { Stage, requiredTags } from '../types';

import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { getRemovalPolicyFromStage } from '../utils';

export interface StatelessStackProps extends CustomStackProps {
  stateless: {
    runtimes: lambda.Runtime;
  };
  env: {
    region: string;
  };
  shared: {
    stage: Stage;
    metricNamespace: string;
    serviceName: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
      sampleRate: string;
    };
  };
  serviceTable: dynamodb.Table;
  idempotencyTable: dynamodb.Table;
}

export class OrdersServiceCdkMindsetStatelessStack extends CustomStack {
  constructor(scope: Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    const {
      shared: {
        stage,
        serviceName,
        metricNamespace,
        logging: { logEvent, logLevel, sampleRate },
      },
      stateless: { runtimes },
      serviceTable,
      idempotencyTable,
    } = props;

    const tags: Tags = {
      'order-service:operations:StackId': 'Stateless',
      'order-service:operations:ServiceId': `order-service-${stage}-app`,
      'order-service:operations:ApplicationId': `order-service-${stage}`,
      'order-service:cost-allocation:Owner': 'cdk-mindset',
      'order-service:cost-allocation:ApplicationId': `order-service-${stage}-app`,
      'order-service:cost-allocation:Environment': stage,
    };

    const lambdaConfig = {
      POWERTOOLS_LOG_LEVEL: logLevel,
      POWERTOOLS_LOGGER_LOG_EVENT: logEvent,
      POWERTOOLS_LOGGER_SAMPLE_RATE: sampleRate,
      POWERTOOLS_TRACE_ENABLED: 'true',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: serviceName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_TRACER_CAPTURE_ERRORS: 'true',
      POWERTOOLS_METRICS_NAMESPACE: metricNamespace,
    };

    // create our sns topic for our alarm (this would allow us to send emails when in alarm state)
    // note: for this demo we dont attach a subscription to the topic for ses
    const alertingServiceTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `ErrorAlarmTopicStateless${stage}`,
      topicName: `error-alarm-topic-stateless-${stage}`,
      enforceSSL: true,
    });

    // we create a lambda function for creating a new order
    const { function: createOrderLambda, widgets: createOrderLambdaWidgets } =
      new LambdaFunction(this, 'CreateOrderLambda', {
        functionName: `create-order-lambda-${stage}`,
        entry: path.join(
          __dirname,
          './src/adapters/primary/create-order/create-order.adapter.ts',
        ),
        description: `Create Order Lambda ${stage}`,
        architecture: lambda.Architecture.ARM_64,
        runtime: runtimes,
        environment: {
          ...lambdaConfig,
          TABLE_NAME: serviceTable.tableName,
          IDEMPOTENCY_TABLE_NAME: idempotencyTable.tableName,
          CREATE_LATENCY: 'false',
          CREATE_ERROR: 'true',
        },
        removalPolicy: getRemovalPolicyFromStage(stage),
        metricNamespace: metricNamespace,
        metricName: 'CreateOrderErrors',
        filterName: 'CreateOrderFilter',
        metricFilterPattern: 'ERROR',
        alarmName: `${stage}-order-service-create-order-errors`,
        alarmDescription: 'Alarm if CreateOrder logs contain errors',
        topic: alertingServiceTopic,
        metricsService: serviceName,
        region: this.region,
        metricSuccessName: 'SuccessfulCreateOrder',
        metricSuccessNameTitle: 'Create Order Success',
        metricErrorName: 'CreateOrderError',
        metricErrorNameTitle: 'Create Order Errors',
        createWidget: true, // we will create a custom dashboard for the stateless stack for our functions only
      });

    // give the function access to dynamodb tables (service table and idempotency table)
    serviceTable.grantWriteData(createOrderLambda);
    idempotencyTable.grantReadWriteData(createOrderLambda);

    // create the rest api and attach our lambda function
    const api = new RestApi(this, 'OrdersApi', {
      deploy: true,
      stageName: stage,
      description: `Orders Service API ${stage}`,
    }).api;

    const root: apigw.Resource = api.root.addResource('v1');
    const orders: apigw.Resource = root.addResource('orders');

    orders.addMethod(
      'POST',
      new apigw.LambdaIntegration(createOrderLambda, {
        proxy: true,
      }),
    );

    // add our monitoring
    const monitoringFacade = new MonitoringFacade(
      this,
      `order-service-monitoring-${stage}-stateless`,
      {
        alarmFactoryDefaults: {
          alarmNamePrefix: 'alarm',
          actionsEnabled: true,
          action: new SnsAlarmActionStrategy({
            onAlarmTopic: alertingServiceTopic,
          }),
          evaluationPeriods: 1,
          datapointsToAlarm: 3,
        },
      },
    );
    monitoringFacade.addLargeHeader(
      `Order Service Stateless (${stage})`,
      true,
      false,
    );

    // add the sns alarm
    monitoringFacade.monitorSnsTopic({
      topic: alertingServiceTopic,
      alarmFriendlyName: `${stage}-sns-topic-alarms`,
      addMessageNotificationsFailedAlarm: {
        Warning: {
          maxNotificationsFailedCount: 1,
          datapointsToAlarm: 1,
          period: Duration.minutes(5),
          alarmNameOverride: `${stage}-sns-notifications-failed`,
          treatMissingDataOverride: TreatMissingData.NOT_BREACHING,
        },
      },
    });

    // add the api gateway alarms
    monitoringFacade.monitorApiGateway({
      api: api,
      alarmFriendlyName: `${stage}-api-alarms`,
      add4XXErrorCountAlarm: {
        Critical: {
          maxErrorCount: 1,
          datapointsToAlarm: 1,
          alarmNameOverride: `${stage}-api-4xx-errors`,
          period: Duration.minutes(5),
          treatMissingDataOverride: TreatMissingData.NOT_BREACHING,
        },
      },
      add5XXFaultCountAlarm: {
        Critical: {
          maxErrorCount: 1,
          datapointsToAlarm: 1,
          alarmNameOverride: `${stage}-api-5xx-errors`,
          period: Duration.minutes(5),
          treatMissingDataOverride: TreatMissingData.NOT_BREACHING,
        },
      },
    });

    addTagsToStack(this, tags);

    // we add the widgets for our lambda function to the custom dashboard
    this.addWidgets(createOrderLambdaWidgets);

    // cdk-nag checks for best practice compliance
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));

    // our own aspect to check required tags are applied
    Aspects.of(this).add(new RequiredTagsChecker(requiredTags));

    // supressions in cdk-nag that are valid
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatelessStack${stage}/CreateOrderLambda/CreateOrderLambdaLambda/ServiceRole/Resource`,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason:
            'CDK automatically attaches this so your function can write to CloudWatch Logs',
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatelessStack${stage}/CreateOrderLambda/CreateOrderLambdaLambda/ServiceRole/DefaultPolicy/Resource`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason:
            'CDK automatically attaches this so your function can write to X-Ray',
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatelessStack${stage}/OrdersApi/OrdersApiApi/Resource`,
      [
        {
          id: 'AwsSolutions-APIG2',
          reason:
            'The validation happens in the application code not at the API Gateway level',
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatelessStack${stage}/OrdersApi/OrdersApiApi/CloudWatchRole/Resource`,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'The L2 construct adds a managed role as default',
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatelessStack${stage}/OrdersApi/OrdersApiApi/Default/v1/orders/POST/Resource`,
      [
        {
          id: 'AwsSolutions-COG4',
          reason: 'This is a demo only',
        },
        {
          id: 'AwsSolutions-APIG4',
          reason: 'This is a demo only',
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatelessStack${stage}/OrdersApi/OrdersApiApi/DeploymentStage.api/Resource`,
      [
        {
          id: 'AwsSolutions-APIG3',
          reason: 'This is a demo only - no WAF needed',
        },
      ],
    );
  }
}
