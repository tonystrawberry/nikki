---
title: "Day 21"
date: "2026-04-13"
excerpt: "DDIA chapter 7/8 study, concurrency testing practice, AWS architecture notes, and AI adoption mindset for developers."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ddia", "reading", "transactions", "youtube", "video", "concurrency", "testing", "distributed-systems", "aws", "iam-identity-center", "sandbox", "ai"]
---

## Today, I:

- finished reading DDIA chapter 7 on transactions and wrote [DDIA Chapter 7: Transactions](/en/posts/ddia-chapter-7-transactions) for the DDIA collection
- watched [Transactions, ACID, and Isolation Levels — DDIA Chapter 7](/en/posts/ddia-chapter-7-transactions-acid-and-isolation-video) — live walkthrough of ACID, isolation level names vs semantics, Postgres MVCC and vacuum/autovacuum, and InnoDB undo logs for snapshots
- learned how to write a simple generic concurrent test where two workers update different records in parallel and both updates persist without a lost update
- started reading DDIA chapter 8 on the trouble with distributed systems and wrote [DDIA Chapter 8: The Trouble with Distributed Systems](/en/posts/ddia-chapter-8-the-trouble-with-distributed-systems), will finish it tomorrow
- read AWS [Innovation Sandbox on AWS](https://docs.aws.amazon.com/solutions/innovation-sandbox-on-aws/) and noted the reference architecture for account access, web ui hosting, event-driven workflows, and sandbox account governance
- read AWS Builder Center’s [AI won’t replace developers, but ignoring it will cost you](https://builder.aws.com/content/3C849AI6lTrLJQG0bBFo1UdO20o/ai-wont-replace-developers-but-ignoring-it-will-cost-you)

## Generic Ruby/Rails RSpec snippet

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

## AWS Innovation Sandbox on AWS (quick summary)

- uses **IAM Identity Center** to let admins/managers/sandbox users access sandbox accounts with centralized authn/authz
- serves the web ui through **CloudFront + S3**, with API traffic protected by **WAF** and routed via **API Gateway**
- executes workflow logic with **Lambda**, **EventBridge**, and **Step Functions** for account lifecycle and automation
- stores state/config in **DynamoDB** and **AppConfig**, with a clear separation between control plane and managed sandbox accounts

![AWS Innovation Sandbox architecture](/images/blog/2026-04-13/aws-innovation-sandbox-architecture.png)
