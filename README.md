# The CDK Mindset: Building Serverless Solutions As Repeatable Blueprints

This talk covers best practices for building production-grade, repeatable AWS CDK solutions as a blueprint using TypeScript, with a focus on delivering scalable, observable, and maintainable infrastructure from the outset.

> A PDF version of the talk can be found [here](<./presentation/The%20CDK%20Mindset%20Building%20Serverless%20Solutions%20As%20Repeatable%20Blueprints%20(30%20mins).pdf>)

![title-slide](./docs/images/The%20CDK%20Mindset%20Building%20Serverless%20Solutions%20As%20Repeatable%20Blueprints.jpg)

## Overview

This repository is a basic example code base for the talk `'The CDK Mindset: Building Serverless Solutions As Repeatable Blueprints'`, which allows attendees to access the code in their own time to work through the slides.

The talk focuses on best practices for building production-grade, repeatable AWS CDK solutions as a blueprint using TypeScript, with a focus on delivering scalable, observable, and maintainable infrastructure from the outset.

The talk covers the following topics:

- Modularise stacks and code for better maintainability and scalability
- Inject environment-specific configuration for flexible deployments
- Establish ephemeral environments from day one
- Bake in observability with tools like Lambda Powertools
- Accelerate development using Aspects and Level 3 constructs
- Quickly add dashboards and alarms in a repeatable manner
- Enforce governance using CDK Nag

## Deploying

To deploy the code, cd into the `orders-service-cdk-mindset` folder and run the following command:

> npm run deploy:develop

To destroy the stack please subsequently run:

> npm run remove:develop

## Testing

There is a Postman file in the directory: `orders-service-cdk-mindset/postman/cdk-mindset.postman_collection.json` which allows you to test the solution.

There is one endpoint on the API which is a POST on /orders with the following example payload:

```json
{
  "customerId": "cust-123",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "price": 19.99
    },
    {
      "productId": "prod-002",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "total": 89.97
}
```
