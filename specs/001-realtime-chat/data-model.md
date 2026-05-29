# Data Model: Realtime Visitor Chat

## Rails Models

### Conversation

```ruby
# app/models/conversation.rb
class Conversation < ApplicationRecord
  has_many :messages, dependent: :destroy

  validates :session_token, presence: true, uniqueness: true
  validates :visitor_name, presence: true, length: { maximum: 50 }
end
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | integer | PRIMARY KEY | Auto-increment |
| session_token | string | UNIQUE NOT NULL, indexed | Links to visitor's browser localStorage token (UUID v4) |
| visitor_name | string | NOT NULL | Auto-generated ("Visitor #N") or user-provided |
| unread_count | integer | NOT NULL DEFAULT 0 | Count of visitor messages not yet read by admin |
| created_at | datetime | NOT NULL | Rails timestamp |
| updated_at | datetime | NOT NULL | Rails timestamp (acts as last_active_at) |

### Message

```ruby
# app/models/message.rb
class Message < ApplicationRecord
  belongs_to :conversation, touch: true

  validates :sender, presence: true, inclusion: { in: %w[visitor admin] }
  validates :content, presence: true, length: { maximum: 2000 }
end
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | integer | PRIMARY KEY | Auto-increment |
| conversation_id | integer | NOT NULL, FK, indexed | Parent conversation |
| sender | string | NOT NULL, CHECK IN (visitor, admin) | Who sent the message |
| content | text | NOT NULL | Message text (plain text only) |
| created_at | datetime | NOT NULL | Rails timestamp |
| updated_at | datetime | NOT NULL | Rails timestamp |

Note: `belongs_to :conversation, touch: true` automatically updates the conversation's `updated_at` on each new message, which serves as `last_active_at`.

### PushSubscription

```ruby
# app/models/push_subscription.rb
class PushSubscription < ApplicationRecord
  validates :endpoint, presence: true, uniqueness: true
  validates :p256dh, presence: true
  validates :auth, presence: true
end
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | integer | PRIMARY KEY | Auto-increment |
| endpoint | string | UNIQUE NOT NULL | Push service endpoint URL |
| p256dh | string | NOT NULL | Client public key |
| auth | string | NOT NULL | Client auth secret |
| created_at | datetime | NOT NULL | Rails timestamp |
| updated_at | datetime | NOT NULL | Rails timestamp |

## Indexes

```ruby
add_index :conversations, :session_token, unique: true
add_index :conversations, :updated_at
add_index :messages, [:conversation_id, :created_at]
```

## Entity Relationships

```
Conversation 1 ──── * Message
     │
     └── session_token ←── Browser localStorage (client-side)

PushSubscription (standalone, admin-only)
```

## State Transitions

### Conversation Lifecycle

```
[Created] ──message──► [Active] ──idle──► [Stale]
                          │                  │
                          └──delete──► [Deleted]
                                         │
                                   (dependent: :destroy removes all messages)
```

- **Created**: First message from visitor creates the conversation.
- **Active**: `updated_at` updates on each message (via `touch: true`).
- **Stale**: No explicit state — determined by `updated_at` age (display-only).
- **Deleted**: Tony deletes from admin. `dependent: :destroy` removes all messages.

### Unread Count

- Incremented when a visitor sends a message.
- Reset to 0 when admin opens the conversation (via `mark_read` action).

## Data Volume Estimates

At ~50 visitors/day, ~10% chatting, ~10 messages per conversation:
- ~5 new conversations/day → ~1,825/year
- ~50 new messages/day → ~18,250/year
- SQLite handles millions of rows; no scaling concern at this volume.
