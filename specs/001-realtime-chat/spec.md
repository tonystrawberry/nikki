# Feature Specification: Realtime Visitor Chat

**Feature Branch**: `001-realtime-chat`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "A realtime chat backed with a websocket server for discussing with me. I will be able to access the chats via https://nikki-tony.vercel.app/admin/chats, all the chats of all users by selecting them from a list. The user (non-logged-in) will be able to open a chat with me. Session is linked with the browser. Give me the cheapest way to host the websocket server."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Opens a Chat (Priority: P1)

A visitor lands on the blog and sees a chat widget. They click it and can immediately type a message to Tony without needing to log in or create an account. Their chat session persists across page navigations within the same browser. If they close the tab and return later (same browser), they see their previous conversation.

**Why this priority**: This is the core value proposition — visitors must be able to reach Tony effortlessly with zero friction.

**Independent Test**: A visitor opens the blog, clicks the chat widget, sends a message, navigates to another page, and sees the same conversation. Closing and reopening the browser restores the conversation history.

**Acceptance Scenarios**:

1. **Given** a visitor on any page of the blog, **When** they click the chat widget, **Then** a chat panel opens with an empty conversation (or their previous conversation if one exists).
2. **Given** a visitor with an open chat, **When** they type a message and send it, **Then** the message appears instantly in the chat panel.
3. **Given** a visitor who previously chatted, **When** they return to the site in the same browser, **Then** their previous messages are visible and the conversation continues.
4. **Given** a visitor on a mobile device, **When** they open the chat, **Then** the chat panel is usable and does not obstruct core site content.

---

### User Story 2 - Tony Receives and Replies to Messages in Real Time (Priority: P1)

Tony navigates to the admin chat page and sees a list of all visitor conversations. He selects a conversation to view the full message history, and can type a reply. Messages from both sides appear in real time without page refresh.

**Why this priority**: Without the admin reply capability, the chat is one-directional and useless. This is equally critical as the visitor side.

**Independent Test**: Tony opens the admin page, sees a list of active conversations with preview text, selects one, reads the full history, sends a reply, and verifies the reply appears on the visitor's chat in real time.

**Acceptance Scenarios**:

1. **Given** Tony is on the admin chat page, **When** a visitor sends a message, **Then** the conversation list updates in real time showing the new message preview.
2. **Given** Tony selects a conversation, **When** he views it, **Then** the full message history is displayed in chronological order.
3. **Given** Tony types a reply and sends it, **When** the visitor's chat is open, **Then** the reply appears instantly in the visitor's chat panel.
4. **Given** multiple visitors are chatting simultaneously, **When** Tony switches between conversations, **Then** each conversation maintains its own independent history.

---

### User Story 3 - Conversation Persistence and History (Priority: P2)

All messages are stored so that conversations survive server restarts and are available for Tony to review at any time, even if the visitor is no longer online. Tony can see when visitors were last active.

**Why this priority**: Without persistence, conversations are lost on server restart, making the feature unreliable for async communication (Tony may not be online when a visitor messages).

**Independent Test**: A visitor sends a message, the server restarts, Tony opens the admin page and can still see the message and reply to it.

**Acceptance Scenarios**:

1. **Given** a visitor sent messages earlier, **When** Tony opens the admin page hours later, **Then** all previous messages are visible.
2. **Given** a conversation exists, **When** the server restarts, **Then** the conversation is not lost.
3. **Given** the conversation list, **When** Tony views it, **Then** each conversation shows the visitor's last active time and unread message count.

---

### User Story 4 - Unread Notifications for Admin (Priority: P3)

Tony can see at a glance which conversations have unread messages. New messages from visitors are visually highlighted in the conversation list.

**Why this priority**: Nice-to-have for usability but the core chat works without it.

**Independent Test**: A visitor sends a message. Tony opens the admin page and sees the conversation highlighted as unread. After opening it, the highlight clears.

**Acceptance Scenarios**:

1. **Given** a visitor sends a new message, **When** Tony views the conversation list, **Then** that conversation is marked as unread with a visual indicator.
2. **Given** Tony opens an unread conversation, **When** he views the messages, **Then** the unread indicator clears.

---

### Edge Cases

- What happens when the visitor's browser storage is cleared? A new session is created; the old conversation becomes orphaned but remains visible to Tony in admin.
- What happens when Tony is offline and a visitor sends a message? The message is stored and Tony sees it when he next opens the admin page.
- What happens when the WebSocket connection drops? The client attempts to reconnect automatically and re-syncs missed messages.
- What happens when many visitors chat simultaneously? The system handles concurrent conversations without message loss or cross-talk.
- What happens on the admin page if there are no conversations yet? An empty state is displayed with a clear message.

## Clarifications

### Session 2026-05-29

- Q: How is the admin page authenticated? → A: Basic authentication using environment variables for username and password, verified via a login form that sets a session cookie.
- Q: Is spam/rate limiting needed for the public chat widget? → A: No. At this scale (~50 visitors/day), spam is handled manually. Rate limiting is out of scope for v1.
- Q: Can Tony manage conversation lifecycle (archive, close, delete)? → A: Tony can permanently delete conversations from the admin page. No archive or close functionality for v1.
- Q: How is Tony notified of new messages when not on the admin page? → A: Browser push notification, if Tony has previously visited the admin page and granted notification permission.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a chat widget accessible from any page of the blog.
- **FR-002**: Visitors MUST be able to send messages without creating an account or logging in.
- **FR-003**: Visitor sessions MUST be tied to the browser (persisted via browser-local storage mechanism) so that returning visitors in the same browser resume their existing conversation.
- **FR-004**: Messages MUST be delivered in real time using a persistent bidirectional connection (WebSocket).
- **FR-005**: The system MUST provide an admin page at `/admin/chats` where Tony can view all visitor conversations.
- **FR-006**: The admin conversation list MUST display: visitor identifier, last message preview, last active time, and unread count.
- **FR-007**: Tony MUST be able to select a conversation and view the full message history.
- **FR-008**: Tony MUST be able to reply to any conversation, with the reply appearing in real time on the visitor's side.
- **FR-009**: All messages MUST be persisted so they survive server restarts.
- **FR-010**: The admin page MUST be protected via basic authentication. Username and password MUST be stored as environment variables. A login form MUST verify credentials and set a session cookie granting access for subsequent requests.
- **FR-011**: The chat UI MUST support the three project locales (fr, en, ja) per the Internationalization First principle.
- **FR-012**: The WebSocket server MUST be hostable at the lowest possible cost (ideally free tier or near-free).
- **FR-013**: Tony MUST be able to permanently delete a conversation from the admin page. Deletion removes the conversation and all its messages.
- **FR-014**: The admin page MUST request browser notification permission. When a new visitor message arrives and Tony is not on the admin page, a browser push notification MUST be sent (requires Tony to have previously granted permission).

### Key Entities

- **Conversation**: Represents a chat session between one visitor and Tony. Identified by a unique session token. Contains metadata: created time, last active time, visitor display name (auto-generated or optional input).
- **Message**: A single message within a conversation. Contains: sender (visitor or admin), content (text), timestamp. Ordered chronologically.
- **Visitor Session**: Links a browser to a conversation via a persistent token stored client-side. One browser = one session = one conversation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can send their first message within 5 seconds of clicking the chat widget (no signup, no loading delays).
- **SC-002**: Messages appear on the recipient's screen within 1 second of being sent when both parties are online.
- **SC-003**: The system handles at least 20 concurrent visitor conversations without degradation.
- **SC-004**: Conversations persist across server restarts with zero message loss.
- **SC-005**: The admin page loads the conversation list within 2 seconds, even with 100+ stored conversations.
- **SC-006**: The WebSocket server hosting cost is $0/month under normal usage (personal blog traffic of ~50 visitors/day).
- **SC-007**: The chat widget does not increase the blog's initial page load time by more than 100ms.

## Assumptions

- Tony is the sole admin user; there is no need for multi-admin support or role-based access control beyond a single admin credential.
- Visitor traffic is low (personal blog scale: ~50 visitors/day, ~5-10 concurrent chats at peak). The system does not need to scale to enterprise levels.
- Messages are text-only. File uploads, images, emoji reactions, and rich formatting are out of scope for v1.
- Rate limiting and spam prevention are out of scope for v1. At personal blog traffic levels, spam is handled manually by Tony via the admin interface.
- The admin page at `/admin/chats` does not need to follow the `[locale]` routing pattern since it is a private tool, not a public-facing page.
- The chat widget is a floating overlay (e.g., bottom-right corner) that does not require a dedicated route.
- Visitor display names are auto-generated (e.g., "Visitor #3") unless the visitor optionally provides a name.
- Message history retention is indefinite; no auto-deletion policy is needed at this scale.
- The existing Vercel deployment hosts the Next.js frontend; the WebSocket server is a separate service since Vercel does not support persistent WebSocket connections on its serverless platform.
