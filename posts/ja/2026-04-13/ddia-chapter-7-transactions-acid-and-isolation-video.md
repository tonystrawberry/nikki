---
title: "トランザクション、ACID、分離レベル — DDIA 第7章（動画）"
date: "2026-04-13"
excerpt: "DDIA第7章のライブ解説。なぜトランザクションが重要か、ACID、分離レベルの名前と落とし穴、PostgresのMVCCとvacuum、MySQL/InnoDBのundo logを整理。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "transactions", "acid", "isolation", "postgresql", "mysql", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=AiYvR8yBMaU"
collection: "ddia"
collectionOrder: 7
collectionTitle: "Designing Data-Intensive Applications"
---

## 概要

*Designing Data-Intensive Applications* の **第7章（Transactions）** を扱う **ライブ配信** の内容。発表者（PlanetScale）は、トランザクションはリレーショナルDBが広く使われる理由の中核であり、**同時読み書き**、**書き込み失敗**、そしてハードウェアやプロセス障害時に **実際に何が永続化されたか** を考えるうえで重要だと説明する。配信では書籍内容に加え、ホワイトボード風の図解や Q&A（Postgres vacuum、レプリカなど）も含まれる。

## なぜトランザクションと ACID が重要か

- **トランザクション** は処理をひとかたまりにして、**原子性**（all-or-nothing）と失敗時の明確な意味付けを提供する。単一行だけでなく、複数ステートメントの処理にも有効。
- **ACID** はリレーショナルDBでよく語られるが、一部は **厳密定義ではない**。発表では **atomicity, consistency, isolation, durability** は SQL に限らず多くのDBシステムで求められる目標だと強調される。
- 章でいう **durability** は **ログ、チェックサム、flush-to-disk** に結びつく。運用観点では **replication**（複数コピー、リージョン、同期/非同期）とも重なり、1台や1拠点の喪失が唯一のデータコピー喪失にならないようにする。

## 分離レベル（名前と実際の意味）

- SQL には **read uncommitted**, **read committed**, **repeatable read**, **serializable** という分離レベル名があるが、書籍は **実装差** を強調する。同じ名前でもエンジン間で挙動は一致しないことがある。
- 分離が弱すぎると **phantom read**、想定外の上書き、トランザクションの相互作用による不整合が起きる。アプリ開発側はデフォルトの **isolation level** を把握し、意図的に調整する必要がある。

## Snapshot isolation と Postgres 型 MVCC

- **Snapshot isolation**（多くの場合 **MVCC**）では、トランザクション開始時（または初回読取時点）の **一貫したスナップショット** を読む。並行コミットの結果を即時に全部見るわけではない。
- 配信では **Postgres 型**の挙動として、**行バージョン** と **transaction ID**（可視性の min/max）を説明。更新で **新しい行バージョン** が作られ、古いトランザクションは完了まで古いバージョンを読み続けられる。
- **長時間トランザクション** はコストが高い。1つのスナップショットのために **古い行バージョンを大量保持** する必要があり、OLTPワークロードで **ストレージと vacuum** 圧力が増える。

## Vacuum、autovacuum、table bloat（Postgres）

- **VACUUM**（**autovacuum** を含む）は、どのアクティブトランザクションにも不要になった **dead row version** を回収し、テーブル全体を即時再構築せずに領域を再利用可能にする。
- **VACUUM FULL** 系の処理は、より積極的にディスクを回収するためにテーブルを **再構築** できるが、強いロックが必要になる場合がある（大規模テーブルで重要）。
- 書き込み速度が vacuum を上回ると **table bloat** が増える。論理データ量に比べディスク使用量が大きくなるのは、不要バージョンが多く残るため。

## MySQL / InnoDB: in-place update と undo log

- Postgres が多くの更新で新しい行バージョンを作るのに対し、**InnoDB** は B-tree 上で **in-place update** を行うことが多く、bloat へのトレードオフが異なる。
- **repeatable read** / snapshot 相当の意味を実現するため、InnoDB は **undo log** を使って、先に開始したトランザクション向けに **過去の行イメージ** を復元する。つまり毎回メインページに完全な複製行を保持する方式ではない。

## 重要ポイント

- **トランザクションと分離** は実践的な調整ノブであり、誤った前提は並行処理下で微妙なバグを生む。
- 分離レベルの **名前は標準化** されていても、**挙動は移植可能とは限らない**。エンジンごとのドキュメント確認が必須。
- **MVCC**（Postgres）と **undo log**（InnoDB）は、書き込み継続中に **snapshot 的な読み取り** を提供する2つの実装アプローチ。
- **運用の追従** が重要。**vacuum/autovacuum**、**長時間トランザクション**、**書き込み量** は、**ディスク増加と性能** に直接影響する。

---
*Claudeによる翻訳*
