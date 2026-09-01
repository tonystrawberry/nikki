---
title: "Day 67"
date: "2026-08-24"
excerpt: "ブロック内のSQLクエリ数を数えるシンプルなRails/RSpecヘルパーを保存 — プリロードでN+1を防げるか検証するのに便利。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "rspec", "sql", "n+1", "testing", "active-record"]
coverImage: ""
---

## 今日やったこと：

- ブロック内のSQLクエリ数を数えるシンプルなRails/RSpecヘルパーを保存 — プリロードでN+1クエリを防げるか検証するのに便利（`SCHEMA`と`CACHE`クエリはカウントから除外）

```ruby
# frozen_string_literal: true

# Helper to count SQL queries executed within a block.
# Useful for verifying that preloading prevents N+1 queries.
#
# Usage:
#   query_count = count_queries { some_code }
#   expect(query_count).to eq(0)
module QueryCounter
  # Counts the number of SQL queries executed within the given block.
  # SCHEMA and CACHE queries are excluded from the count.
  #
  # @yield the block whose SQL queries will be counted
  # @return [Integer] the number of SQL queries executed
  #
  # @example Verify that preloaded associations do not trigger additional queries
  #   query_count = count_queries { chat.each(&:messages) }
  #   expect(query_count).to eq(0)
  def count_queries(&)
    count = 0
    counter = lambda do |_name, _start, _finish, _id, payload|
      count += 1 unless payload[:name].in?(%w[SCHEMA CACHE])
    end

    ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &)
    count
  end
end

RSpec.configure do |config|
  config.include QueryCounter
end
```

---

> 🌐 *Claudeによる翻訳*
