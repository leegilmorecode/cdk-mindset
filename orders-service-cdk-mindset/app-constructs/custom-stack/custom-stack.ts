import * as cdk from 'aws-cdk-lib';
import type * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import type { Construct } from 'constructs';
import { CloudwatchDashboard } from '../cloudwatch-dashboard/cloudwatch-dashboard';

/**
 * Props for CustomStack.
 * Extends the standard CDK StackProps with dashboard configuration options.
 */
export interface CustomStackProps extends cdk.StackProps {
  /**
   * The name of the CloudWatch Dashboard to create.
   * This will be visible in the AWS Console.
   */
  dashboardName: string;

  /**
   * A markdown-formatted description for the dashboard.
   * Displayed as a header widget at the top of the dashboard.
   */
  dashboardDescription: string;

  /**
   * Whether to create a CloudWatch Dashboard for this stack.
   * When false, widgets can still be added but won't be rendered anywhere.
   */
  createDashboard: boolean;
}

/**
 * A custom CDK Stack that optionally creates a CloudWatch Dashboard and manages widgets.
 *
 * This stack provides a convenient interface for adding CloudWatch widgets that can be
 * either displayed on a dashboard (if enabled) or simply tracked for later use.
 * All widgets added to the stack are stored internally, regardless of dashboard creation.
 *
 * @example
 * ```typescript
 * const stack = new CustomStack(app, 'MyStack', {
 *   dashboardName: 'my-dashboard',
 *   dashboardDescription: '# Application Metrics',
 *   createDashboard: true,
 * });
 *
 * stack.addWidget(new cloudwatch.GraphWidget({
 *   title: 'API Requests',
 *   // ... widget config
 * }));
 * ```
 */
export class CustomStack extends cdk.Stack {
  /**
   * The CloudWatch Dashboard instance, if dashboard creation is enabled.
   * Will be undefined if createDashboard is false.
   * @private
   */
  private readonly dashboard: cloudwatch.Dashboard;

  /**
   * Collection of all widgets added to this stack.
   * Widgets are tracked regardless of whether a dashboard is created.
   */
  public readonly widgets: cloudwatch.ConcreteWidget[] = [];

  /**
   * Flag indicating whether dashboard functionality is enabled for this stack.
   * @private
   */
  private readonly isDashboardEnabled: boolean;

  /**
   * Creates a new CustomStack with optional CloudWatch Dashboard support.
   *
   * @param scope - The scope in which to define this construct
   * @param id - The scoped construct ID
   * @param props - Configuration properties for the stack and optional dashboard
   */
  constructor(scope: Construct, id: string, props?: CustomStackProps) {
    super(scope, id, props);

    const { dashboardName, dashboardDescription, createDashboard } =
      props as CustomStackProps;

    this.isDashboardEnabled = createDashboard;

    // Create dashboard only if explicitly enabled in props
    if (createDashboard) {
      this.dashboard = new CloudwatchDashboard(this, `${id}Dashboard`, {
        dashboardName,
        dashboardDescription,
      }).dashboard;
    }
  }

  /**
   * Adds a single widget to the stack.
   * The widget is stored in the widgets array and added to the dashboard if enabled.
   *
   * @param widget - The CloudWatch widget to add
   *
   * @example
   * ```typescript
   * stack.addWidget(new cloudwatch.TextWidget({
   *   markdown: '## Section Title',
   * }));
   * ```
   */
  public addWidget(widget: cloudwatch.ConcreteWidget): void {
    this.widgets.push(widget);

    if (this.isDashboardEnabled) {
      this.dashboard.addWidgets(widget);
    }
  }

  /**
   * Adds multiple widgets to the stack at once.
   * All widgets are stored in the widgets array and added to the dashboard if enabled.
   *
   * @param widgets - Array of CloudWatch widgets to add
   *
   * @example
   * ```typescript
   * stack.addWidgets([
   *   new cloudwatch.GraphWidget({ title: 'Metric 1' }),
   *   new cloudwatch.GraphWidget({ title: 'Metric 2' }),
   * ]);
   * ```
   */
  public addWidgets(widgets: cloudwatch.ConcreteWidget[]): void {
    this.widgets.push(...widgets);

    if (this.isDashboardEnabled) {
      this.dashboard.addWidgets(...widgets);
    }
  }

  /**
   * Retrieves all widgets that have been added to this stack.
   *
   * @returns Array of all widgets added via addWidget() or addWidgets()
   */
  public getWidgets(): cloudwatch.ConcreteWidget[] {
    return this.widgets;
  }

  /**
   * Retrieves the CloudWatch Dashboard instance.
   *
   * @returns The dashboard instance, or undefined if createDashboard was false
   *
   * @remarks
   * Callers should check if the dashboard exists before using it, especially
   * if the createDashboard flag might be false.
   */
  public getDashboard(): cloudwatch.Dashboard {
    return this.dashboard;
  }
}
