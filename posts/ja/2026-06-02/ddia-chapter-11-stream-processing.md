---
title: "DDIA 第11章：ストリーム処理"
date: "2026-06-02"
excerpt: "Designing Data-Intensive Applicationsのストリーム処理メモ — イベントストリーム、メッセージブローカー、CDC、イベントソーシング、時間セマンティクス、ストリーム結合、フォールトトレランス。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["distributed-systems", "ddia", "stream-processing", "kafka", "event-sourcing"]
collection: "ddia"
collectionOrder: 11
collectionTitle: "Designing Data-Intensive Applications"
---

*Designing Data-Intensive Applications*第11章はバッチの続き。バッチが「巨大データセットで何が起きたか？」に答えるなら、**ストリーム処理**は「イベントが届くたびに今何が起きているか？」を問う。

## ストリーム処理の位置づけ

第10章の3システムモデル：

- **サービス（オンライン）：** ミリ秒レイテンシ
- **バッチ（オフライン）：** 分〜時間
- **ストリーム（ニアリアルタイム）：** 秒 — リクエスト/レスポンスほど即時ではないがバッチより速い

## イベントとイベントストリーム

**イベント**は過去の事実の不変の小さな記録。コマンドや状態とは異なる。

**イベントストリーム**は時間順の（通常）非有界シーケンス。エンコーディング：JSONは簡単だがスキーマ進化は難しい。Avro、Protobuf、スキーマレジストリ。

## メッセージブローカーとログ

| モデル | 挙動 | 例 |
|--------|------|-----|
| **キュー（AMQP/JMS）** | ack後削除；競合consumers | RabbitMQ、SQS |
| **ログ（Kafka）** | 保持；offset；replay | Kafka、Pulsar |

**パーティション分割ログ**でスループット。バッチング、順次ディスク書き込み、ゼロコピー。

at-least-onceが一般的；consumersは冪等に。

## データベースとストリーム

**DBのWALはすでにイベントストリーム。**

### CDC

行変更をイベントストリームに。Debeziumがトランザクションログをtail。

### イベントソーシング

現在状態ではなく**イベント列**を保存。replayで状態を導出。

利点：監査、時間クエリ、進化。欠点：スキーマ進化、長いreplay、削除の扱い。

## ストリーム処理の用途

CEP、ストリーム分析、マテリアライズドビュー、検索インデックス更新、アラート。

## 時間の扱い

- **イベント時刻** vs **処理時刻**
- **ウィンドウ**：タンブリング、ホッピング、スライディング、セッション
- **ウォーターマーク**

## ストリーム結合

stream–stream、stream–table、table–table。

## フォールトトレランス

マイクロバッチ、チェックポイント、冪等書き込み + at-least-once。

## バッチ vs ストリーム

Lambda、Kappa、現代の「1エンジン2モード」。

## 要点

- イベントは不変の事実；ストリームは非有界
- Kafkaはreplayとfan-out
- CDCとイベントソーシングがDBとストリームを接続
- イベント時刻・ウォーターマーク・ストリーム結合
- バッチとストリームは対立ではなくパートナー

---
> 🌐 *Claudeによる翻訳*
