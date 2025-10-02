import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import {
  MonitoringFacade,
  SnsAlarmActionStrategy,
} from 'cdk-monitoring-constructs';
import {
  CustomStack,
  CustomStackProps,
  DynamoDbTable,
  IdempotencyTable,
} from '../app-constructs';
import { addTagsToStack, RequiredTagsChecker, type Tags } from '../aspects';

import { Aspects, Duration } from 'aws-cdk-lib';
import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { requiredTags, Stage } from '../types';
import { getRemovalPolicyFromStage } from '../utils';

export interface StatefulStackProps extends CustomStackProps {
  stateful: {
    serviceTableName: string;
    idempotencyTableName: string;
  };
  env: {
    region: string;
  };
  shared: {
    stage: Stage;
    metricNamespace: string;
  };
}

export class OrdersServiceCdkMindsetStatefulStack extends CustomStack {
  public readonly serviceTable: dynamodb.Table;
  public readonly idempotencyTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StatefulStackProps) {
    super(scope, id, props);

    const {
      stateful: { serviceTableName, idempotencyTableName },
      shared: { stage },
    } = props;

    const tags: Tags = {
      'order-service:operations:StackId': 'Stateful',
      'order-service:operations:ServiceId': `order-service-${stage}-app`,
      'order-service:operations:ApplicationId': `order-service-${stage}`,
      'order-service:cost-allocation:Owner': 'cdk-mindset',
      'order-service:cost-allocation:ApplicationId': `order-service-${stage}-app`,
      'order-service:cost-allocation:Environment': stage,
    };

    // create our sns topic for our alarm (this would allow us to send emails when in alarm state)
    // note: for this demo we dont attach a subscription to the topic for ses
    const alertingServiceTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `ErrorAlarmTopicStateful${stage}`,
      topicName: `error-alarm-topic-stateful-${stage}`,
      enforceSSL: true,
    });

    // create the service table
    const { table, widget } = new DynamoDbTable(this, 'Table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: getRemovalPolicyFromStage(stage),
      widgetTitle: 'DynamoDB Table Metrics',
      createWidget: false,
      tableName: serviceTableName,
    });
    this.serviceTable = table;

    // create the idempotency table to work with Lambda Powertools
    this.idempotencyTable = new IdempotencyTable(this, 'IdempotencyTable', {
      tableName: idempotencyTableName,
      removalPolicy: getRemovalPolicyFromStage(stage),
    }).table;

    // add our monitoring
    const monitoringFacade = new MonitoringFacade(
      this,
      `order-service-monitoring-${stage}-stateful`,
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
      `Order Service Stateful (${stage})`,
      true,
      false,
    );

    // add the monitoring for the service table
    monitoringFacade.monitorDynamoTable({
      table: this.serviceTable,
      alarmFriendlyName: `${stage}-${serviceTableName}-alarms`,
      addReadThrottledEventsCountAlarm: {
        Warning: {
          maxThrottledEventsThreshold: 1,
          alarmNameOverride: `${stage}-service-table-read-throttle-events`,
          datapointsToAlarm: 1,
          period: Duration.minutes(5),
          treatMissingDataOverride: TreatMissingData.NOT_BREACHING,
        },
      },
      addWriteThrottledEventsCountAlarm: {
        Warning: {
          alarmNameOverride: `${stage}-service-table-write-throttle-events`,
          maxThrottledEventsThreshold: 1,
          datapointsToAlarm: 1,
          period: Duration.minutes(5),
          treatMissingDataOverride: TreatMissingData.NOT_BREACHING,
        },
      },
    });

    // add the widget to the custom dashboard
    // (in this example we are not creating a custom dashboard for the stateful stack)
    this.addWidget(widget);

    addTagsToStack(this, tags);

    // cdk-nag checks for best practice compliance
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));

    // our own aspect to check required tags are applied
    Aspects.of(this).add(new RequiredTagsChecker(requiredTags));

    // supressions in cdk-nag that are valid
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/OrdersServiceCdkMindsetStatefulStack${stage}/IdempotencyTable/IdempTableIdempotencyTable/Resource`,
      [
        {
          id: 'AwsSolutions-DDB3',
          reason: 'We dont need PITR on the idempotency table',
        },
      ],
    );
  }
}
