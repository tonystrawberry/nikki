---
title: "Day 45"
date: "2026-06-11"
excerpt: "Watched two Hello Interview videos — designing Dropbox / Google Drive and Kafka vs RabbitMQ — and set up a Datadog Bits AI agent to send a daily application-health report."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "system-design", "distributed-systems", "kafka", "rabbitmq", "message-queue", "datadog", "observability", "llm"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Today, I:

- watched [System Design Interview: Design Dropbox or Google Drive w/ a Ex-Meta Staff Engineer](/en/posts/system-design-interview-design-dropbox-google-drive-ex-meta-staff-engineer) — presigned-URL uploads straight to blob storage, chunking large files for resumable uploads and dedup, and syncing changes across devices
- watched [Kafka vs RabbitMQ](/en/posts/kafka-vs-rabbitmq) — log vs queue as the root distinction, consumer groups vs acked push delivery, and when to reach for streams/replay versus a task queue
- at work, used Datadog's new Bits AI agent — which lets you program an LLM agent to answer questions about your logs, metrics, and traces — to generate a daily report analyzing the previous day's data across our monitored services, delivered every morning at 9:30 as another read on application health on top of our existing monitors and dashboards
