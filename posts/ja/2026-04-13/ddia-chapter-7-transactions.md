---
title: "DDIA 第7章：トランザクション"
date: "2026-04-13"
excerpt: "Kleppmann のトランザクション章の要約。ACID、分離レベルの異常、snapshot isolation、two-phase locking、serializable snapshot isolation を整理。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "transactions", "acid", "isolation", "distributed-systems", "mvcc"]
collection: "ddia"
collectionOrder: 7
collectionTitle: "Designing Data-Intensive Applications"
---

## 概要

*Designing Data-Intensive Applications* 第7章は **トランザクション** がテーマ。読み取りと書き込みを1つの論理単位として扱い、クラッシュや同時アクセスがあっても **安全性保証**（一般に **ACID**）を提供する考え方を扱う。章の中心は **分離（isolation）** で、トランザクションを並行実行したときにどのような異常が起きるか、そして **分離レベル** が性能と「直列実行らしさ」をどうトレードオフするかを説明している。

## なぜトランザクションが重要か

- **all-or-nothing:** トランザクション全体が commit されるか、まったく反映されない（**atomicity**）。複数行や複数インデックスを更新する際のエラーハンドリングが単純になる。
- **クラッシュリカバリ:** DB は **ログ**（例: WAL）を使って commit 済みの処理を再起動後も保持し、abort したトランザクションは rollback する。
- **同時アクセス:** 明確なルールがないと、読み書きの interleaving により、アプリケーション側で推論しにくい **race condition** が発生する。

**ACID** は有用なラベルだが厳密に標準化されているわけではない。特に "consistency" はDB制約とアプリ不変条件が混ざって語られやすい。

## 異常と分離レベル

**完全な直列実行**（常に1トランザクションずつ）は遅すぎることが多いため、弱い分離レベルが使われる。弱いレベルでは、同じトランザクション集合の *どの* 直列順序にも一致しない実行スケジュールが許容される。代表的な問題：

| Phenomenon | Idea |
|------------|------|
| **Dirty read** | 他トランザクションがまだ commit していない書き込みを読む。 |
| **Dirty write** | 他トランザクションの未 commit データを上書きする。 |
| **Read skew (non-repeatable read)** | 1つのトランザクション内で同じクエリを2回実行すると、途中の他トランザクション commit により異なるスナップショットが見える。 |
| **Lost update** | 2トランザクションが同じ状態に read-modify-write し、一方の更新がもう一方を潰す。 |
| **Write skew** | それぞれは局所的に整合した判断をするが、合わせると不変条件を壊す（典型例: 当番医2人が同時に off duty になる）。 |
| **Phantom read** | 範囲クエリを再実行すると、他トランザクションが挿入した新規行が見える。 |

**Snapshot isolation** は、トランザクション開始時（または初回読取時）時点の **一貫したスナップショット** を各トランザクションに与えるため、多くの read skew を防げる。ただし **write skew は自動では防げない**。**明示的制約** や **serializable** が必要になる場合がある。

## Read Committed

よくあるデフォルト。読み取りは常に **commit 済み** データのみで、**短い書き込みロック** により dirty write を防ぐ。一方、トランザクション全体で安定したスナップショットは保証しないため、non-repeatable read は起こり得る。

## Snapshot Isolation と Multi-Version Concurrency Control (MVCC)

Snapshot isolation はしばしば **MVCC** で実装される。DB は複数バージョンの行を保持し、トランザクションは自分のスナップショット時点で可視なバージョンを読む。writer は新しいバージョンを作り、reader と writer は一般に互いをブロックしにくい（**first-writer-wins** や **abort on conflict** の規則に従う）。

## Serializable Isolation

Serializable 実行とは、結果が「ある順序でトランザクションを1つずつ実行したのと同じ」に見えること。つまり（システムが主張する保証範囲で）lost update、write skew、phantom を防ぐ。

章で触れられる実装戦略：

- **実際に直列実行する:** ワークロードが適合するなら、単一スレッド（または単一パーティション）で処理。短いトランザクション中心の in-memory 系では非常に高速になり得る。
- **Two-phase locking (2PL):** 古典的な強ロック方式。**predicate / index-range lock** により既存行だけでなくアクセス経路もロックして phantom を防ぐ。
- **Serializable snapshot isolation (SSI):** snapshot isolation 上に載る楽観的方式。並行トランザクション間の **依存関係** を追跡し、危険パターン（例: serialization graph cycle）で **abort** する。snapshot に近い性能と serializable 意味論の両立を狙う。

## 汎用 Rails/RSpec 例: Lost Update のテスト

Rails アプリで並行書き込みを検証する簡易パターン。2つの worker が同一 JSON state の別キーを更新し、両方の更新が残ることを確認する。

```ruby
# spec/models/job_concurrency_spec.rb
require "rails_helper"

RSpec.describe "concurrent updates", type: :model do
  it "keeps both updates without lost update" do
    job = Job.create!(
      state: {
        "node_a" => { "status" => "pending" },
        "node_b" => { "status" => "pending" }
      }
    )

    ready = Queue.new
    go = Queue.new

    threads = %w[node_a node_b].map do |node_key|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          local = Job.find(job.id)
          ready << true
          go.pop
          local.update_node_status!(node_key, "succeeded")
        end
      end
    end

    2.times { ready.pop } # both workers prepared
    2.times { go << true } # release at nearly same time
    threads.each(&:join)

    reloaded = Job.find(job.id)
    expect(reloaded.state.dig("node_a", "status")).to eq("succeeded")
    expect(reloaded.state.dig("node_b", "status")).to eq("succeeded")
  end
end
```

```ruby
# app/models/job.rb
class Job < ApplicationRecord
  # Example column: state :jsonb
  def update_node_status!(node_key, new_status)
    with_lock do
      data = state.deep_dup
      data[node_key] ||= {}
      data[node_key]["status"] = new_status
      update!(state: data)
    end
  end
end
```

`with_lock` により行レベルで read-modify-write が原子的になり、一方の worker がもう一方の変更を誤って上書きしにくくなる。

## まとめ

- **トランザクション** は原子性と明確な失敗意味論のために処理を束ねる。**分離** はどの並行 interleaving を許可するかを定義する。
- 弱い分離はスループットを上げるが、特定の **異常** を持ち込む。分離レベル選定では **read skew**、**lost update**、**write skew**、**phantom** の理解が必須。
- **Snapshot isolation + MVCC** は読み取り多めのワークロードで広く使われるが、すべての書き込みパターンで完全な serializable と同義ではない。
- **Serializable** は **直列実行**、**2PL**（phantom 対策の predicate locking 含む）、**SSI** で実現可能。それぞれ運用上のトレードオフが異なる。

---
> 🌐 *Claudeによる翻訳*
