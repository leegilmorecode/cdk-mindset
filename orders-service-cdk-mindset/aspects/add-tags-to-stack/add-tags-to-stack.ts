import * as cdk from 'aws-cdk-lib';

/**
 * A record of tag key-value pairs to be applied to AWS resources.
 *
 * @example
 * ```typescript
 * const tags: Tags = {
 *   Environment: 'production',
 *   Team: 'platform',
 *   CostCenter: '12345',
 * };
 * ```
 */
export type Tags = Record<string, string>;

/**
 * Adds multiple tags to a CDK Stack and all its resources.
 *
 * This utility function iterates through the provided tags object and applies
 * each key-value pair to the stack using CDK's tagging API. Tags will be
 * propagated to all resources within the stack that support tagging.
 *
 * @param stack - The CDK Stack to which tags will be applied
 * @param tags - An object containing tag key-value pairs to add
 *
 * @example
 * ```typescript
 * const stack = new cdk.Stack(app, 'MyStack');
 *
 * addTagsToStack(stack, {
 *   Environment: 'production',
 *   Owner: 'team-platform',
 *   Project: 'my-project',
 * });
 * ```
 *
 * @remarks
 * - Tags are applied to all taggable resources within the stack
 * - Tag keys and values must comply with AWS tagging requirements
 * - Maximum of 50 tags per resource (AWS limitation)
 */
export function addTagsToStack(stack: cdk.Stack, tags: Tags) {
  for (const tag of Object.entries(tags)) {
    cdk.Tags.of(stack).add(...tag);
  }
}
