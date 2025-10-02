import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Stage } from '../../types';

interface ApiProps
  extends Pick<
    apigw.RestApiProps,
    'description' | 'deploy' | 'defaultCorsPreflightOptions'
  > {
  /**
   * The stage name which the api is being used with
   */
  stageName: string;
  /**
   * The api description
   */
  description: string;
  /**
   * Whether or not to deploy the api
   */
  deploy: boolean;
  /**
   * Cors Options
   */
  defaultCorsPreflightOptions?: apigw.CorsOptions;
}

type FixedApiProps = Omit<apigw.RestApiProps, 'description' | 'deploy'>;

export class RestApi extends Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    // Determine CORS options based on the stageName
    const corsOptions =
      props.stageName !== Stage.staging &&
      props.stageName !== Stage.prod &&
      props.stageName !== Stage.test
        ? {
            // default to allowing all CORS headers for other stages (ephemeral)
            allowOrigins: apigw.Cors.ALL_ORIGINS,
            allowCredentials: true,
            allowMethods: ['OPTIONS', 'POST', 'GET', 'PUT', 'DELETE', 'PATCH'],
            allowHeaders: ['*'],
          }
        : props.defaultCorsPreflightOptions;

    const fixedProps: FixedApiProps = {
      defaultCorsPreflightOptions: corsOptions,
      endpointTypes: [apigw.EndpointType.REGIONAL],
      cloudWatchRole: true,
      retainDeployments: false,
      restApiName: `api-${props.stageName}`,
      disableExecuteApiEndpoint: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigw.LogGroupLogDestination(
          new logs.LogGroup(this, `${id}ApiLogs`, {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_DAY,
          }),
        ),
      },
    };

    this.api = new apigw.RestApi(this, `${id}Api`, {
      // fixed props
      ...fixedProps,
      // custom props
      description: props.description
        ? props.description
        : `API ${props.stageName}`,
      deploy: props.deploy !== undefined ? props.deploy : true,
      disableExecuteApiEndpoint: false,
    });
  }
}
