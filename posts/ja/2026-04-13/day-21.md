---
title: "Day 21"
date: "2026-04-13"
excerpt: "DDIA第7章/第8章の学習、並行テストの実践、AWSアーキテクチャのメモ、そして開発者向けAI活用マインドセット。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ddia", "reading", "transactions", "youtube", "video", "concurrency", "testing", "distributed-systems", "aws", "iam-identity-center", "sandbox", "ai"]
---

## 今日やったこと：

- DDIA第7章（トランザクション）を読み終え、DDIAコレクション向けに [DDIA Chapter 7: Transactions](/ja/posts/ddia-chapter-7-transactions) を書いた
- [Transactions, ACID, and Isolation Levels — DDIA Chapter 7](/ja/posts/ddia-chapter-7-transactions-acid-and-isolation-video) を視聴した。ACID、分離レベルの名前と実際の意味、Postgres の MVCC と vacuum/autovacuum、スナップショットのための InnoDB undo log までをライブで解説していた
- 2つのワーカーが別々のレコードを並行更新し、lost update なしで両方の更新が保持される、シンプルで汎用的な並行テストの書き方を学んだ
- 分散システムの難しさを扱う DDIA 第8章の読み始めとして [DDIA Chapter 8: The Trouble with Distributed Systems](/ja/posts/ddia-chapter-8-the-trouble-with-distributed-systems) を書いた。続きは明日仕上げる
- AWS の [Innovation Sandbox on AWS](https://docs.aws.amazon.com/solutions/innovation-sandbox-on-aws/) を読み、アカウントアクセス、web ui ホスティング、event-driven ワークフロー、sandbox アカウントガバナンスのリファレンスアーキテクチャをメモした
- AWS Builder Center の [AI won’t replace developers, but ignoring it will cost you](https://builder.aws.com/content/3C849AI6lTrLJQG0bBFo1UdO20o/ai-wont-replace-developers-but-ignoring-it-will-cost-you) を読んだ

## 汎用 Ruby/Rails RSpec スニペット

```ruby
# spec/models/job_concurrency_spec.rb
it "keeps both updates without lost update" do
  job = Job.create!(state: { "a" => { "status" => "pending" }, "b" => { "status" => "pending" } })
  ready = Queue.new
  go = Queue.new

  threads = %w[a b].map do |key|
    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        local = Job.find(job.id)
        ready << true
        go.pop
        local.update_node_status!(key, "succeeded")
      end
    end
  end

  2.times { ready.pop }
  2.times { go << true }
  threads.each(&:join) # wait for both threads to finish

  result = Job.find(job.id)
  expect(result.state.dig("a", "status")).to eq("succeeded")
  expect(result.state.dig("b", "status")).to eq("succeeded")
end
```

```ruby
# app/models/job.rb
def update_node_status!(key, status)
  with_lock do
    data = state.deep_dup
    data[key]["status"] = status
    update!(state: data)
  end
end
```

## AWS Innovation Sandbox on AWS（クイック要約）

- **IAM Identity Center** を使い、管理者/マネージャー/サンドボックス利用者が集中管理された authn/authz で sandbox アカウントへアクセスできる
- web ui は **CloudFront + S3** で配信し、API トラフィックは **WAF** で保護して **API Gateway** 経由でルーティングする
- アカウントライフサイクルと自動化のワークフローロジックは **Lambda**、**EventBridge**、**Step Functions** で実行する
- 状態/設定は **DynamoDB** と **AppConfig** に保存し、control plane と管理対象 sandbox アカウントを明確に分離している

![AWS Innovation Sandbox architecture](/images/blog/2026-04-13/aws-innovation-sandbox-architecture.png)

---
*Claudeによる翻訳*
