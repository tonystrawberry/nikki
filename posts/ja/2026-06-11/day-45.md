---
title: "Day 45"
date: "2026-06-11"
excerpt: "Hello Interview の動画を2本視聴（Dropbox / Google Drive の設計と Kafka vs RabbitMQ）し、アプリケーションの健全性を毎日レポートする Datadog Bits AI エージェントをセットアップした。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "system-design", "distributed-systems", "kafka", "rabbitmq", "message-queue", "datadog", "observability", "llm"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- [System Design Interview: Design Dropbox or Google Drive w/ a Ex-Meta Staff Engineer](/ja/posts/system-design-interview-design-dropbox-google-drive-ex-meta-staff-engineer) を視聴した。presigned URL を使って blob ストレージへ直接アップロードする方法、レジューム可能なアップロードと重複排除のために大きなファイルをチャンクに分割すること、そしてデバイス間で変更を同期する仕組みについて学んだ
- [Kafka vs RabbitMQ](/ja/posts/kafka-vs-rabbitmq) を視聴した。ログとキューという根本的な違い、consumer group と ack 付き push 配信の違い、そしてストリームやリプレイが欲しい場面とタスクキューが欲しい場面の使い分けについて学んだ
- 仕事では、Datadog の新しい Bits AI エージェントを使った。これはログ・メトリクス・トレースに関する質問に答える LLM エージェントをプログラムできる機能で、監視対象の各サービスについて前日のデータを分析する日次レポートを生成させた。毎朝9時30分に配信され、既存のモニターやダッシュボードに加えてアプリケーションの健全性をもう一つの視点から確認できるようにした

---

> 🌐 *Claudeによる翻訳*
