# Tasks: Realtime Visitor Chat

**Input**: Design documents from `specs/001-realtime-chat/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/websocket-protocol.md

**Tests**: No test framework — validation via `npm run lint && npm run build` (frontend) and `bin/rails db:migrate && bin/rails server` (backend).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Initialize the Rails 8 API-only app and prepare the Next.js frontend

- [x] T001 Create Rails 8 API-only app in chat-server/ — run `rails new chat-server --api --database=sqlite3 --skip-test --skip-system-test --skip-action-mailer --skip-action-mailbox --skip-action-text --skip-active-job --skip-active-storage` from repo root, then add `web-push` and `rack-cors` gems to Gemfile, run `bundle install`
- [x] T002 [P] Create shared chat type definitions in src/lib/chat-types.ts — Message, Conversation, VisitorChannel/AdminChannel message types matching contracts/websocket-protocol.md
- [x] T003 [P] Add chat widget i18n strings to src/dictionaries/fr.json, src/dictionaries/en.json, src/dictionaries/ja.json and update the Dictionary interface in src/lib/i18n-config.ts with a `chatWidget` section (placeholder, send, connecting, connectionError, typePlaceholder, chatWithMe, closeChat)
- [x] T004 [P] Install `@rails/actioncable` npm dependency in the project root — run `npm install @rails/actioncable`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Rails infrastructure — models, database, auth, CORS, ActionCable connection

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create database migrations in chat-server/ — generate migrations for conversations (session_token:string:uniq, visitor_name:string, unread_count:integer), messages (conversation:references, sender:string, content:text), and push_subscriptions (endpoint:string:uniq, p256dh:string, auth:string); add indexes per data-model.md; run `bin/rails db:migrate`
- [x] T006 [P] Create ActiveRecord models — chat-server/app/models/conversation.rb (has_many :messages dependent destroy, validations), chat-server/app/models/message.rb (belongs_to conversation touch true, validations for sender inclusion and content length), chat-server/app/models/push_subscription.rb (validations)
- [x] T007 [P] Configure CORS in chat-server/ — add rack-cors middleware in config/initializers/cors.rb allowing ALLOWED_ORIGINS env var (default localhost:3000) with credentials support for cookies
- [x] T008 [P] Configure Solid Cable in chat-server/config/cable.yml — set adapter to solid_cable for development and production, configure polling_interval to 0.1 seconds
- [x] T009 Implement ApplicationCable::Connection in chat-server/app/channels/application_cable/connection.rb — identify visitor connections by session_token query param, identify admin connections by Rails session cookie containing admin flag; reject unauthorized admin connections
- [x] T010 [P] Create ActionCable client wrapper in src/lib/chat-client.ts — wrapper around @rails/actioncable createConsumer, typed subscription helpers for VisitorChannel and AdminChannel, connection URL from NEXT_PUBLIC_CHAT_WS_URL env var
- [x] T011 Implement auth controller in chat-server/app/controllers/auth_controller.rb — POST /auth/login (verify against ADMIN_USER/ADMIN_PASSWORD env vars, set session[:admin] = true), DELETE /auth/logout (reset session), configure routes in config/routes.rb
- [x] T012 Add health check endpoint in chat-server/config/routes.rb — GET /health returns JSON status and uptime

**Checkpoint**: Foundation ready — Rails server boots, database migrated, CORS configured, ActionCable connection works

---

## Phase 3: User Story 1 - Visitor Opens a Chat (Priority: P1) MVP

**Goal**: Visitors can open a floating chat widget on any page, send messages, and see their conversation persist across page navigations and browser sessions.

**Independent Test**: Open the blog, click the chat widget, send a message, navigate to another page — the conversation persists. Close and reopen the browser — previous messages are visible.

- [x] T013 [US1] Implement VisitorChannel in chat-server/app/channels/visitor_channel.rb — on subscribe: look up conversation by session_token from connection, send history if exists; send_message action: validate content (non-empty, max 2000 chars), create conversation on first message (auto-generate visitor_name as "Visitor #N"), create message, broadcast to visitor stream, broadcast new_message to admin stream, increment unread_count, trigger push notification if admin not connected
- [x] T014 [P] [US1] Create ChatPanel component in src/components/ChatPanel.tsx — Client Component displaying message list (scrollable, auto-scroll to bottom), message input with send button, message bubbles styled differently for visitor vs admin, timestamp display, loading/connecting states
- [x] T015 [US1] Create ChatWidget floating overlay in src/components/ChatWidget.tsx — Client Component with chat bubble button (bottom-right, fixed position), expandable panel containing ChatPanel, session token management (generate UUID on first visit, store in localStorage), ActionCable subscription via chat-client.ts, mobile-responsive (full-width on screens < 640px)
- [x] T016 [US1] Integrate ChatWidget into the locale layout by adding it to src/app/[locale]/layout.tsx — render ChatWidget as a Client Component at the bottom of the layout

**Checkpoint**: Visitors can send messages via the chat widget. Messages stored in SQLite. Conversation persists across navigations.

---

## Phase 4: User Story 2 - Tony Receives and Replies in Real Time (Priority: P1)

**Goal**: Tony can log into an admin page, see all conversations, select one, view full history, reply in real time, and delete conversations.

**Independent Test**: Open admin page, log in, see conversation list, reply to a visitor — verify reply appears in visitor's widget in real time. Delete a conversation and verify removal.

- [x] T017 [US2] Implement AdminChannel in chat-server/app/channels/admin_channel.rb — on subscribe: verify admin from connection, send conversation list; list_conversations action: query and send all conversations sorted by updated_at desc; get_history action: send all messages for a conversation; send_message action: create message, broadcast to visitor stream and admin stream; mark_read action: reset unread_count to 0
- [x] T018 [US2] Implement conversations controller in chat-server/app/controllers/conversations_controller.rb — GET /conversations (list with last_message preview), GET /conversations/:id/messages, DELETE /conversations/:id (destroy with dependent messages); all actions require admin session; add routes
- [x] T019 [P] [US2] Create admin login page in src/app/admin/login/page.tsx — form with username/password fields, POST to NEXT_PUBLIC_CHAT_HTTP_URL/auth/login with credentials: 'include', redirect to /admin/chats on success, show error on failure
- [x] T020 [US2] Create admin chats layout in src/app/admin/chats/layout.tsx — Server Component wrapper with minimal layout (no locale routing)
- [x] T021 [US2] Create AdminChat component in src/components/AdminChat.tsx — Client Component with two-panel layout: left panel shows conversation list (visitor name, last message preview, relative time, unread badge), right panel shows selected conversation history with reply input; ActionCable AdminChannel subscription; delete button per conversation with confirmation dialog
- [x] T022 [US2] Create admin chats page in src/app/admin/chats/page.tsx — renders AdminChat, passes env URLs as props

**Checkpoint**: Full two-way real-time chat works. Tony can log in, view, reply, and delete.

---

## Phase 5: User Story 3 - Persistence & History (Priority: P2)

**Goal**: Conversations survive server restarts. Metadata (last active time, age) is displayed.

**Independent Test**: Send a message, restart Rails server, reopen admin — all messages still visible.

- [x] T023 [US3] Add conversation metadata display to AdminChat in src/components/AdminChat.tsx — show relative updated_at time ("5 min ago") in conversation list, show created_at date in conversation header, sort by updated_at descending
- [x] T024 [US3] Handle orphaned sessions in chat-server/app/channels/visitor_channel.rb — when a visitor connects with a session_token whose conversation was deleted by admin, treat as new visitor (no error, just no history)

**Checkpoint**: Persistence verified. Conversations survive restarts. Metadata displayed.

---

## Phase 6: User Story 4 - Unread & Push Notifications (Priority: P3)

**Goal**: Unread indicators in admin. Browser push notifications when Tony is away.

**Independent Test**: Visitor sends message, admin sees unread badge, opening clears it. Close admin, visitor sends another message, Tony gets push notification.

- [x] T025 [US4] Add unread visual indicators to AdminChat in src/components/AdminChat.tsx — numeric badge on conversations with unread_count > 0, bold visitor name, send mark_read when conversation selected
- [x] T026 [US4] Implement web push notification service in chat-server/app/services/push_notification_service.rb — use web-push gem with VAPID keys from env vars, load all PushSubscription records, send notification with visitor name and message preview; handle expired subscriptions (delete on 410 response)
- [x] T027 [US4] Implement push subscriptions controller in chat-server/app/controllers/push_subscriptions_controller.rb — POST /push_subscriptions (create), DELETE /push_subscriptions (destroy by endpoint); require admin session; add routes
- [x] T028 [US4] Add service worker at public/sw-chat.js — listen for push events, show Notification with message data; in AdminChat, request Notification permission on mount, subscribe via PushManager with NEXT_PUBLIC_VAPID_PUBLIC_KEY, POST subscription to server
- [x] T029 [US4] Wire push notifications into VisitorChannel in chat-server/app/channels/visitor_channel.rb — after creating a visitor message, check if admin is connected via AdminChannel; if not connected, call PushNotificationService to send push

**Checkpoint**: Unread badges work. Push notifications fire when admin is offline.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Deployment readiness and final quality pass

- [x] T030 [P] Create Dockerfile for chat-server in chat-server/Dockerfile — multi-stage build with Ruby 3.3, jemalloc, Thruster; production SQLite databases in /rails/storage; expose port 3000
- [x] T031 [P] Create Kamal deploy config at chat-server/config/deploy.yml — service name, image, server IP placeholder, proxy SSL config, env vars (clear + secret), storage volume mount
- [x] T032 [P] Add .env.example files — chat-server/.env.example with all server env vars; update project root .env.local.example with NEXT_PUBLIC_CHAT_WS_URL, NEXT_PUBLIC_CHAT_HTTP_URL, NEXT_PUBLIC_VAPID_PUBLIC_KEY
- [x] T033 [P] Mobile responsive polish for ChatWidget in src/components/ChatWidget.tsx — full-width on screens < 640px, chat bubble does not overlap footer, smooth open/close animation with Tailwind transitions
- [x] T034 Update .gitignore — add chat-server/storage/, chat-server/tmp/, chat-server/log/
- [x] T035 Run `npm run lint && npm run build` in project root — fix any TypeScript or lint errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (Rails app exists). T005-T012 partially parallelizable.
- **US1 (Phase 3)**: Depends on Phase 2 completion. T014 can start in parallel with T013.
- **US2 (Phase 4)**: Depends on Phase 2. Recommended after US1 (admin needs visitor messages to exist).
- **US3 (Phase 5)**: Depends on US1 + US2 completion.
- **US4 (Phase 6)**: Depends on US2 completion.
- **Polish (Phase 7)**: Depends on all user stories.

### Parallel Opportunities

```text
Phase 1:
  T001 (sequential — creates Rails app)
  T002 + T003 + T004 (parallel — frontend-only, independent)

Phase 2:
  T005 → T009, T011 (sequential: migrations first, then models/auth that depend on DB)
  T006 + T007 + T008 + T010 (parallel: independent configs and frontend)
  T012 (independent)

Phase 3:
  T013 (sequential — server-side first)
  T014 (parallel with T013 — independent component)
  T015 → T016 (sequential: widget before layout integration)

Phase 4:
  T017 + T018 (parallel — channel + controller)
  T019 + T020 (parallel — independent pages)
  T021 → T022 (sequential: component before page)

Phase 7:
  T030 + T031 + T032 + T033 (all parallel — independent files)
```

---

## Implementation Strategy

### MVP First (US1 + US2: Phases 1-4, 22 tasks)

1. Phase 1: Setup → Rails app + frontend prep
2. Phase 2: Foundational → DB, models, auth, CORS, ActionCable
3. Phase 3: US1 → Visitors can chat
4. Phase 4: US2 → Tony can reply
5. **STOP and VALIDATE**: Two-way real-time chat works end-to-end
6. Deploy via `kamal setup` to Hetzner

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Visitor can send messages (one-directional)
3. US2 → Full two-way chat (deploy-ready MVP)
4. US3 → Verified persistence + metadata
5. US4 → Unread + push notifications (complete feature)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each completed phase
- Rails conventions: `bin/rails generate` for migrations, `bin/rails db:migrate` after
- ActionCable reconnection is automatic via `@rails/actioncable` — no custom logic needed
