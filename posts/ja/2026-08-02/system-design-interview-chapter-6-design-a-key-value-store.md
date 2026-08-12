---
title: "System Design Interview 第6章：Key-Value Store の設計"
date: "2026-08-02"
excerpt: "Alex Xu 著 — CAP、データパーティション、quorum レプリケーション、一貫性モデル、vector clocks、gossip による障害検知、anti-entropy の Merkle tree。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "interview", "key-value", "cap", "vector-clocks", "dynamo", "quorum"]
coverImage: ""
youtubeUrl: ""
collection: "system-design-interview"
collectionOrder: 6
collectionTitle: "System Design Interview"
---

*System Design Interview* 第6章のメモ — 分散 **key-value store**（Dynamo 系）の設計：大規模・高可用で `put(key, value)` / `get(key)`。

衝突検出の深掘り：[ベクタークロックと不整合の解消](/ja/posts/vector-clocks-and-inconsistency-resolution)。関連するデータモデルの文脈：[NoSQL の4カテゴリ](/ja/posts/nosql-four-categories-key-value-document-column-graph)。

## 要件（典型的）

- キーによる put / get
- 数百万キー、高 QPS
- 高可用（古典的な Dynamo 語りでは AP 寄り）
- 調整可能な一貫性
- ノード障害とネットワークパーティションへの対応

## CAP 定理（インタビューでの枠組み）

**ネットワークパーティション** 下では選択が必要：

| 選択 | 意味 |
|--------|---------|
| **CP** | 最新の単一値を保つため一部リクエストを拒否 |
| **AP** | サービスを継続；replica は一時的に乖離しうる |

パーティション耐性なしの **CA** は分散ストアでは現実的でない — パーティションは起きる。それを前提に設計する。

```mermaid
flowchart TB
  P{Network partition?}
  P -->|yes| Choice{Prefer?}
  Choice -->|consistency| CP[CP: refuse some requests]
  Choice -->|availability| AP[AP: serve, may diverge]
  P -->|no| Happy[C + A both feasible locally]
```

本章は **AP + eventual consistency** 寄りで、（quorum などの）ノブでレイテンシと鮮度をトレードオフする。

## 構成要素

### 1. データレイアウト

キーはリング上にハッシュ（[consistent hashing](/ja/posts/system-design-interview-chapter-5-design-consistent-hashing)）、しばしば **仮想ノード** 付き。各キーは N 個の replica（時計回りの次の N 個の異なるノード）の **preference list** 上に存在。

```mermaid
flowchart LR
  subgraph pref["Preference list N=3"]
    K["key X"] --> A[Node A]
    A --> B[Node B]
    B --> C[Node C]
  end
```

### 2. レプリケーション

耐久性 / 可用性のため複数 replica へ書き込み。レプリケーション係数 `N` は設定（例ではよく 3）。

### 3. Quorum

```text
N = replica count
W = write quorum (acks needed for a successful write)
R = read quorum (responses needed for a successful read)
```

経験則：

```text
W + R > N  →  read and write quorums overlap → strong-ish consistency for that key
W + R ≤ N  →  possible stale reads; higher availability / lower latency
```

古典例：`N=3, W=2, R=2`。

```mermaid
flowchart TB
  Coord[Coordinator] -->|write| A[(A)]
  Coord -->|write| B[(B)]
  Coord -->|write| C[(C)]
  A -->|ack| Coord
  B -->|ack| Coord
  C -.->|slow / down| Coord
  Coord -->|"W=2 acks → success"| OK[Write OK]
```

### 4. 一貫性モデル

| モデル | 意味 |
|-------|---------|
| Strong | 成功した書き込みの後、すべての後続読み取りがそれを見る |
| Weak | 読み手が更新をいつ見るかの厳密な保証なし |
| Eventual | 書き込みが止まれば replica は同じ値に収束 |

AP ストアは通常 **eventual** 一貫性を目指し、クライアントに衝突解消を任せる。

## 衝突の扱い：バージョニング

異なる replica への並行書き込みで **siblings** が生じる。壁時計の「last write wins」はクロックスキューで **データを静かに失う**。

**Vector clocks** はノードごとの因果履歴を追う（`[A:2, B:1]`）。読み取り時：

- 一方の版のクロックが支配 → その版を安全に保持
- クロックが分岐 → **両方** の版をクライアントに返してマージ（例：ショッピングカートの和集合）

カートの完全なウォークスルーは [ベクタークロックのメモ](/ja/posts/vector-clocks-and-inconsistency-resolution) を参照。

```mermaid
flowchart TB
  V1["Version A\n[A:2] eggs"] --> Cmp{Compare clocks}
  V2["Version B\n[A:1,B:1] bacon"] --> Cmp
  Cmp -->|one dominates| Keep[Keep winner]
  Cmp -->|diverge| Sib[Return siblings]
  Sib --> App[Client merges]
  App --> V3["Merged\n[A:2,B:1,C:1]"]
```

## メンバーシップと障害検知

- ノードは **gossip** で互いを知る
- 障害検知は heartbeat / suspicion（常に完璧ではない — 一時的な遅延と死亡を区別）
- preference list と hinted handoff で、対象 replica が落ちていても書き込みを継続

```mermaid
flowchart LR
  N1[Node 1] <-->|gossip| N2[Node 2]
  N2 <-->|gossip| N3[Node 3]
  N3 <-->|gossip| N1
```

## Anti-entropy：Merkle tree

Gossip は「誰が生きているか」を捉える。**Merkle tree** は「誰のデータがずれたか」を捉える。

- 各 replica がキーレンジ上のハッシュ木を構築
- ルートを比較 → 不一致の枝だけたどる
- 全体スキャンではなく、乖離したレンジだけ同期

```mermaid
flowchart TB
  R1["Root hash A"] --> L1[Left]
  R1 --> Rgt1[Right]
  R2["Root hash B"] --> L2[Left]
  R2 --> Rgt2[Right]
  R1 -.->|roots differ| Walk[Walk mismatched branch only]
  Walk --> Sync[Sync divergent keys]
```

パーティション後や長期隔離後のバックグラウンド修復に使われる。

## 読み書きパス（スケッチ）

**Write** (`N=3`, `W=2`)

```mermaid
sequenceDiagram
  participant Client
  participant Coord as Coordinator
  participant A
  participant B
  participant C
  Client->>Coord: put(key, value)
  par Replicate
    Coord->>A: write
    Coord->>B: write
    Coord->>C: write
  end
  A-->>Coord: ack
  B-->>Coord: ack
  Note over Coord: W=2 reached
  Coord-->>Client: success
```

**Read** (`R=2`)

```mermaid
sequenceDiagram
  participant Client
  participant Coord as Coordinator
  participant A
  participant B
  Client->>Coord: get(key)
  Coord->>A: read
  Coord->>B: read
  A-->>Coord: version v1
  B-->>Coord: version v2
  alt clocks agree / one dominates
    Coord-->>Client: value
  else diverge
    Coord-->>Client: siblings to merge
  end
```

## 名前を出す価値のあるその他の要素

- **Sloppy quorum + hinted handoff** — 一時的に健全なノードへ書き込み；意図した replica が戻ったら hint を渡す
- **Tunable consistency** — クライアントや API が呼び出しごとに `R` / `W` を選択
- **Local persistence** — 各ノードで commit log + memtable / SSTable 型ストレージ（実装詳細；簡潔に触れる）

## インタビューの要点

Dynamo 型 KV store は1つのトリックではなく **技法のスタック**：

```text
consistent hashing
  + N-way replication
  + quorum (R, W)
  + vector clocks for concurrency
  + gossip for membership
  + Merkle trees for repair
```

CAP と API から入り、quorum + 衝突解消を深掘りする — インタビュー議論の大半はそこに着地する。
