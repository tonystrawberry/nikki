---
title: "Day 67"
date: "2026-08-24"
excerpt: "Saved a simple Rails/RSpec helper that counts SQL queries in a block, useful for asserting that preloading prevents N+1s."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "rspec", "sql", "n+1", "testing", "active-record"]
coverImage: ""
---

## Today, I:

- saved a simple Rails/RSpec helper for counting SQL queries inside a block — useful for verifying that preloading prevents N+1 queries (`SCHEMA` and `CACHE` queries are excluded)

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
