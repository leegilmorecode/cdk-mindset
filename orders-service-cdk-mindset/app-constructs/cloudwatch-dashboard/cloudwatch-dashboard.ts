import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import { Construct } from 'constructs';

/**
 * Props for CloudwatchDashboard construct.
 * Extends the standard CloudWatch DashboardProps with additional configuration.
 */
interface DashboardProps extends cloudwatch.DashboardProps {
  /**
   * A markdown-formatted description to display at the top of the dashboard.
   * This text will be rendered in a full-width widget spanning 24 columns.
   */
  dashboardDescription: string;
}

/**
 * A construct that creates a CloudWatch Dashboard with a description header.
 *
 * This construct wraps the AWS CDK CloudWatch Dashboard and automatically adds
 * a text widget at the top displaying a configurable description. The dashboard
 * is configured to be destroyed when the stack is deleted.
 *
 * @example
 * ```typescript
 * new CloudwatchDashboard(this, 'MyDashboard', {
 *   dashboardName: 'my-service-dashboard',
 *   dashboardDescription: '# My Service Dashboard\n\nMonitoring metrics for my service',
 * });
 * ```
 */
export class CloudwatchDashboard extends Construct {
  /**
   * The underlying CloudWatch Dashboard instance.
   * Use this property to add additional widgets or perform further customization.
   */
  public readonly dashboard: cloudwatch.Dashboard;

  /**
   * Creates a new CloudWatch Dashboard with a description header.
   *
   * @param scope - The scope in which to define this construct
   * @param id - The scoped construct ID
   * @param props - Configuration properties for the dashboard
   */
  constructor(scope: Construct, id: string, props: DashboardProps) {
    super(scope, id);

    this.dashboard = new cloudwatch.Dashboard(this, `${id}Dashboard`, {
      ...props,
    });

    this.dashboard.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Add a full-width text widget at the top with the dashboard description
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: props.dashboardDescription,
        width: 24, // Full width of the dashboard
        height: 2, // Compact height for the header
      }),
    );
  }
}
