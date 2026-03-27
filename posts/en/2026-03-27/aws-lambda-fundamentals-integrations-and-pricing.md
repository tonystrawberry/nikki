---
title: "AWS Lambda Fundamentals, Integrations, and Pricing"
date: "2026-03-27"
excerpt: "A practical summary of AWS Lambda core concepts, pricing model, and common integrations like EventBridge and S3."
author: "Tony Duong"
category: "note"
tags: ["aws", "lambda", "serverless", "eventbridge", "s3", "cloudwatch", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 4
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## What AWS Lambda Is and Why It Matters

AWS Lambda is a serverless compute service where you upload code as functions and AWS runs them on demand. Unlike EC2, you do not manage servers, capacity, or scaling groups.

Why this is useful:

- no server provisioning or patching
- pay only when code runs
- automatic horizontal scaling with concurrency
- event-driven architecture becomes much easier

Lambda is best for short-lived, reactive workloads. Each invocation can run for up to 15 minutes.

## Lambda vs EC2: Core Differences

With EC2:

- you choose fixed CPU and memory upfront
- instances may run continuously even when idle
- scaling requires ASGs and additional operations work

With Lambda:

- you deploy function code only
- execution happens only when invoked
- AWS handles scaling automatically
- billing aligns closely with actual usage

This shift is the main reason Lambda is so popular for modern cloud architectures.

## Pricing Model You Should Remember

Lambda pricing has two dimensions:

- **Requests (invocations):** first 1 million requests per month are free, then low per-million pricing
- **Compute duration:** billed in milliseconds using GB-seconds

Key exam-friendly insight:

- memory selection affects CPU and network performance
- increasing memory can reduce duration and sometimes lower total cost

The free tier is generous, which makes Lambda a cost-effective default for many event-driven tasks.

## Runtime and Packaging Options

Commonly used runtimes include:

- Node.js
- Python
- Java
- C#/.NET
- Ruby

You can also use custom runtimes and container images via the Lambda Runtime API. For exam decisions, container-heavy workloads are often better placed on ECS/Fargate, while Lambda remains ideal for function-style event processing.

## High-Value Integrations

Lambda integrates deeply with AWS services, including:

- API Gateway (backend for REST APIs)
- EventBridge/CloudWatch Events (schedules and event routing)
- S3 (object-created triggers)
- DynamoDB (stream/change triggers)
- SQS and SNS (message and notification processing)
- CloudWatch Logs (operational visibility)
- Cognito (auth lifecycle hooks)

This ecosystem fit is a major advantage of Lambda.

## Hands-On 1: EventBridge Scheduled Invocation

Scenario:

- create `lambda-demo-eventbridge` function
- create EventBridge rule with `rate(1 minute)`
- set Lambda as rule target

What to verify:

- Lambda shows EventBridge trigger in configuration
- Lambda resource-based policy includes permission for `events.amazonaws.com`
- condition restricts invocation to the specific EventBridge rule ARN
- CloudWatch logs confirm periodic invocations
- event payload includes fields like `source`, `detail-type`, `time`, and `resources`

Operational tip: disable the schedule rule after testing to avoid unnecessary invocations.

## Hands-On 2: S3 Object-Created Trigger

Scenario:

- create Lambda function and S3 bucket in the same region
- add S3 Event Notification for object-created events
- set Lambda as destination

What to verify:

- S3 appears as a trigger in Lambda
- Lambda resource policy grants invoke permission to S3 service principal
- uploading an object produces a new CloudWatch log stream
- event payload includes bucket name, object key, size, region, and metadata

This pattern is the foundation for many serverless workflows such as image thumbnail generation, metadata extraction, and file validation pipelines.

## Typical Serverless Patterns

### 1) Reactive file pipeline

- upload file to S3
- S3 event invokes Lambda
- Lambda transforms data and stores output (S3/DynamoDB)

### 2) Serverless cron

- EventBridge schedule triggers Lambda every X minutes/hours
- Lambda executes periodic jobs without maintaining EC2 instances

Both patterns reduce idle cost and simplify operations.

## Exam-Focused Notes

- Lambda max execution time: 15 minutes
- pay per invocation and duration
- memory affects CPU/network allocation
- EventBridge and S3 invoke Lambda through resource-based permissions
- prefer ECS/Fargate for broader container workloads
- Lambda excels when work is event-driven and bursty

## Key Takeaways

- Lambda is a major shift from server-based compute to event-driven functions
- cost model is simple and usually efficient, especially with free tier
- integrations with EventBridge, S3, and other AWS services are central
- resource-based policies explain who can invoke a function
- understanding trigger payloads in CloudWatch is essential for debugging
