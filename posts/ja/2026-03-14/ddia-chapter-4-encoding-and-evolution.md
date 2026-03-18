---
title: "DDIA 第4章: エンコーディングと進化"
date: "2026-03-14"
excerpt: "Kleppmannのデータエンコーディング形式、スキーマ進化、データ集約型システムにおける互換性に関する章の要約。"
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "encoding", "schema", "evolution"]
coverImage: ""
collection: "ddia"
collectionOrder: 4
collectionTitle: "Designing Data-Intensive Applications"
---

## 概要

*Designing Data-Intensive Applications* の第4章は、データのエンコード（シリアライズ）のしかたと、破綻なく時間とともにシステムを進化させる方法に焦点を当てている。アプリケーションは常に変わり続ける。ダウンタイムやデータ損失なしに新コードを投入しスキーマを変更する能力は、エンコーディングの選択と互換性の保証に依存する。

## 言語依存およびテキスト形式

- **言語依存**（Java シリアライゼーション、Python pickle）: 便利だが一つの言語に縛られ、セキュリティやバージョニングの落とし穴があり、サービス間や永続ストレージには向かない。
- **JSON、XML、CSV**: 人間が読め広くサポートされるが、型が弱い（数値と文字列の区別）、スキーマがなく冗長。JSON は API のデフォルト。XML は重い。CSV は最もフラットでネストしたデータには脆い。

**例 — 同じデータの JSON と CSV:** JSON はネストと型をサポートする。CSV はフラット化して構造を失う。

```json
{
  "user_id": 42,
  "name": "Alice",
  "preferences": { "theme": "dark", "notifications": true }
}
```

```csv
user_id,name,preferences.theme,preferences.notifications
42,Alice,dark,true
```

CSV の列名はネストで曖昧になり、数値と文字列の混同があり、null/空の標準がない。

## バイナリエンコーディングとスキーマベース形式

高スループットや大規模データでは、バイナリエンコーディングが容量とパース時間を節約する。スキーマベース形式は構造と進化の意味論を与える:

- **Protocol Buffers (Protobuf)** と **Thrift**: スキーマが必須。コードを生成。フィールドタグ（番号）でエンコード。新フィールドを追加できる。古いリーダーは未知タグを無視。スキーマでのリネームは生成コードだけを変える—オンザワイヤのタグ番号は同じなので、既存データに対してフィールドを本当に「リネーム」することはできない。
- **Avro**: スキーマベースのバイナリ形式で、ライターのスキーマとリーダーのスキーマの二つが関わる。スキーマはデータと一緒に保存されることが多い（例: ファイルヘッダやレジストリ）。フィールドタグはない。エンコーディングは位置ベースなので、フィールド順と互換性ルールが重要。進化するログ/イベントパイプラインやデータレイクに適している。

共通の考え方: **スキーマ**が契約を定義し、エンコーディングはコンパクトで予測可能。進化は互換性ルール（オプショナルフィールドの追加、必須フィールドの削除を避けるなど）で行う。

### Protocol Buffers の例

スキーマで **フィールドタグ**（1, 2, 3…）を定義する。その番号がワイヤ上にエンコードされる—フィールド名ではない。新しいタグで新しいオプショナルフィールドを追加すると、後方互換・前方互換になる。

```protobuf
// person.proto (v1)
message Person {
  required string name = 1;
  required int64 id = 2;
  optional string email = 3;
}

// Later (v2): add optional field — old readers ignore tag 4
message Person {
  required string name = 1;
  required int64 id = 2;
  optional string email = 3;
  optional string phone = 4;   // NEW: new code can set it, old code ignores
}
```

別のフィールドに同じタグ番号を再利用してはいけない。古いデータにそのタグが残っている可能性がある。スキーマでフィールドを「リネーム」しても生成コードが変わるだけ—ワイヤ形式は同じ。

### Avro の例

Avro は **位置**ベースのエンコーディングと明示的なライター/リーダースキーマを使う。リーダースキーマで差分を解決する（例: 「ライターで追加、リーダーにない」→ 無視; 「リーダーで追加、ライターにない」→ デフォルトを使用）。

```json
// User record schema (writer)
{
  "type": "record",
  "name": "User",
  "fields": [
    { "name": "id", "type": "long" },
    { "name": "username", "type": "string" },
    { "name": "email", "type": ["null", "string"], "default": null }
  ]
}
```

バイナリエンコーディングはコンパクト: フィールド名はなく、順序どおりの値だけ。フィールドを追加するときはデフォルト付きで追加し、古いデータも読めるようにする（ライターにそのフィールドがなかった場合、リーダーがデフォルトを補う）。

## スキーマ進化と互換性

- **後方互換性**: 新コードが旧コードの書いたデータを読める（例: 新サーバーが旧メッセージを読む）。通常は「オプショナルフィールドだけ追加」「フィールドを削除しない」を意味する。
- **前方互換性**: 旧コードが新コードの書いたデータを読める（例: 旧クライアントが新サーバーの応答を読む）。通常は「未知フィールドを無視」「以前存在しなかったフィールドを必須にしない」を意味する。

Protobuf/Thrift/Avro では、慣習に従うことで両方を満たせる: オプショナルフィールドを追加し、デフォルトを使い、マルチフェーズロールアウトなしに必須フィールドを削除したり流用したりしない。

**時間経過における互換性:**

```
Backward compatibility (new reader, old data):
  OLD WRITER ──► [old bytes] ──► NEW READER  ✓  (new code understands old format)

Forward compatibility (old reader, new data):
  NEW WRITER ──► [new bytes] ──► OLD READER  ✓  (old code ignores unknown fields)
```

**互換性を壊す変更:**

| Change | Backward? | Forward? |
|--------|-----------|----------|
| Add optional field | ✓ | ✓ |
| Remove required field | ✗ (new reader expects it) | ✓ (old reader didn't need it) |
| Add required field | ✓ | ✗ (old reader can't provide it) |
| Rename field (same tag/position) | ✓ | ✓ (names not on wire) |
| Change field type | Often ✗ | Often ✗ |

## データフローのモード

エンコーディングと進化は文脈によって異なる形で現れる:

- **データベース**: ライター＝行を書くプロセス、リーダー＝後で読むプロセス（多くの場合同じアプリの、おそらく新しいバージョン）。スキーママイグレーション（列追加、バックフィル）は進化の一形態。後方・前方互換性を保つとビッグバンデプロイを避けられる。
- **RPC と REST**: クライアントとサーバーは別バージョンになりうる。後方互換性（新サーバー、旧クライアント）と前方互換性（旧サーバー、新クライアント）の両方が重要。バージョン付き API や慎重なスキーマ進化で破壊を減らせる。
- **メッセージ受け渡し / 非同期**: プロデューサーとコンシューマーは分離され、メッセージは再生されたり何ヶ月後に新しいコンシューマーに読まれたりする。強い互換性と明確なスキーマ進化（例: スキーマレジストリでの Avro）が重要。

**各モードでのデータの流れ:**

```
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE                                                         │
│  App v1 writes row  ──►  [storage]  ──►  App v2 reads row       │
│  (same process over time, or new deployment reading old rows)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RPC / REST                                                       │
│  Client (old or new)  ◄──►  Server (old or new)                  │
│  Both directions must tolerate unknown fields / optional fields  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MESSAGE PASSING (e.g. Kafka, queue)                              │
│  Producer v2  ──►  [log]  ──►  Consumer v1 (or new Consumer v3)  │
│  Messages may be read months later; schema registry + Avro      │
│  let readers resolve writer schema vs reader schema              │
└─────────────────────────────────────────────────────────────────┘
```

## 重要なポイント

- パフォーマンス、明確さ、安全な進化を重視するときは **スキーマベース** のバイナリ形式（Protobuf、Avro、Thrift）を使う。サービス間や永続データには不透明な形式や言語依存のシリアライゼーションを避ける。
- 最初から **後方・前方互換性** を設計する: オプショナルフィールド、必須フィールドの削除なし、「未知フィールドを無視」の振る舞い。
- **Avro** は、リーダーとライターのスキーマが異なりうるイベントストリームやデータレイク、スキーマがデータと一緒に保存される場合に適している。
- **Protobuf と Thrift** は、両端を制御できコード生成と明確なバージョニングが欲しい RPC やサービス間 API に適している。
- 同じ互換性の考え方は **データベース** にも当てはまる。ダウンタイムや一括書き換えを避けたいときは、スキーマ変更（新列、新テーブル）を後方・前方互換にすべきである。

---
*Claudeによる翻訳*
