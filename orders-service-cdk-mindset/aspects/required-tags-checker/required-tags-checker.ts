import { Annotations, type IAspect, Stack } from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';

/**
 * A CDK Aspect that validates stacks have required tags applied.
 *
 * This aspect enforces tagging compliance by checking that all stacks have:
 * 1. At least one tag applied
 * 2. All specified required tags present
 *
 * Violations are reported as CDK errors during synthesis, preventing deployment
 * of non-compliant stacks.
 *
 * @example
 * ```typescript
 * import { Aspects } from 'aws-cdk-lib';
 *
 * const app = new cdk.App();
 * const stack = new cdk.Stack(app, 'MyStack');
 *
 * // Enforce required tags across all stacks
 * Aspects.of(app).add(new RequiredTagsChecker([
 *   'Environment',
 *   'Owner',
 *   'CostCenter',
 * ]));
 *
 * // This will fail synthesis if tags are missing
 * app.synth();
 * ```
 *
 * @implements {IAspect}
 */
export class RequiredTagsChecker implements IAspect {
  /**
   * Creates a new RequiredTagsChecker aspect.
   *
   * @param requiredTags - Array of tag keys that must be present on all stacks
   */
  constructor(private readonly requiredTags: string[]) {}

  /**
   * Visits a construct to check for required tags.
   *
   * This method is called by the CDK framework for each construct in the tree.
   * It only performs validation on Stack constructs, skipping all other construct types.
   *
   * @param node - The construct to validate
   *
   * @remarks
   * Two types of errors can be reported:
   * - If the stack has no tags at all
   * - If any required tag is missing from the stack
   *
   * Errors will cause `cdk synth` or `cdk deploy` to fail.
   */
  public visit(node: IConstruct): void {
    if (!(node instanceof Stack)) return;

    if (!node.tags.hasTags()) {
      Annotations.of(node).addError(`There are no tags on "${node.stackName}"`);
    }

    for (const tag of this.requiredTags) {
      if (!Object.keys(node.tags.tagValues()).includes(tag)) {
        Annotations.of(node).addError(
          `"${tag}" is missing from stack with id "${node.stackName}"`,
        );
      }
    }
  }
}
