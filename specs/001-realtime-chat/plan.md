# Implementation Plan: Realtime Visitor Chat

**Branch**: `001-realtime-chat` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-realtime-chat/spec.md`

## Summary

Build a real-time chat system where blog visitors can message Tony through a floating widget, and Tony can view/reply to all conversations from an admin panel. The frontend (chat widget + admin page) lives in the existing Next.js app on Vercel. The backend is a Rails 8 API-only app with ActionCable (Solid Cable adapter, no Redis) and SQLite, deployed to a Hetzner CX23 VPS (~€3.49/month) via Kamal 2.

## Technical Context

**Language/Version**: Ruby 3.3 / Rails 8.x (backend), TypeScript 5 (frontend)

**Primary Dependencies**:
- Frontend: Next.js 16 (existing), Tailwind CSS v4, shadcn/ui, `@rails/actioncable`
- Backend: Rails 8 (API-only), ActionCable, Solid Cable, Puma, `web-push` gem

**Storage**: SQLite (Rails default, separate DBs for production + cable)

**Testing**: `npm run lint && npm run build` for frontend (per constitution). `rails db:migrate` + server boot for backend.

**Target Platform**: Vercel (frontend) + Hetzner CX23 VPS (Rails backend via Kamal 2)

**Project Type**: Web application (frontend + backend API service)

**Performance Goals**: <1s message delivery (SC-002), <5s to first message (SC-001), <2s admin page load (SC-005)

**Constraints**: ~€3.49/month hosting budget, 20 concurrent conversations, text-only messages

**Scale/Scope**: ~50 visitors/day, ~5-10 concurrent chats at peak, indefinite message retention

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Internationalization First | ✅ PASS | Chat widget UI strings added to all 3 locale dictionaries. Admin page is private, no `[locale]` routing. |
| II. Server-First Rendering | ✅ PASS | Admin/chat page wrappers are Server Components. ChatWidget and AdminChat are Client Components (WebSocket, useState, events). |
| III. Content as Code | ✅ PASS (N/A) | Chat messages in SQLite, not Markdown. No conflict with blog content principle. |
| IV. Type Safety | ✅ PASS | Frontend TypeScript. Backend Ruby has its own type safety via ActiveRecord validations. |
| V. Build-Clean Commits | ✅ PASS | `npm run lint && npm run build` validated for frontend. Rails backend has separate build/deploy via Kamal. |

**Note**: Constitution principle "Node runtime: Dependencies MUST be installable via npm" applies to the Next.js site. The chat server is a separate service with its own runtime (Ruby/Rails), deployed independently. This does not violate the constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-realtime-chat/
├── plan.md              # This file
├── research.md          # Hosting/storage/framework decisions
├── data-model.md        # Rails models and SQLite schema
├── contracts/           # ActionCable channel protocol
│   └── websocket-protocol.md
├── quickstart.md        # Dev setup and deployment guide
└── tasks.md             # Implementation task list
```

### Source Code (repository root)

```text
src/                                  # Next.js frontend (existing)
├── app/
│   ├── [locale]/
│   │   └── (existing pages)
│   └── admin/
│       ├── login/
│       │   └── page.tsx              # Admin login form
│       └── chats/
│           ├── layout.tsx            # Auth guard wrapper
│           └── page.tsx              # Admin chat panel
├── components/
│   ├── ChatWidget.tsx                # Floating chat widget (Client)
│   ├── ChatPanel.tsx                 # Chat message panel (Client)
│   └── AdminChat.tsx                 # Admin conversation list + chat (Client)
├── lib/
│   ├── chat-types.ts                 # TypeScript types for chat
│   └── chat-client.ts               # ActionCable client wrapper
└── dictionaries/
    ├── fr.json                       # + chatWidget strings
    ├── en.json                       # + chatWidget strings
    └── ja.json                       # + chatWidget strings

chat-server/                          # Rails 8 API-only app (Hetzner)
├── Gemfile
├── config/
│   ├── cable.yml                     # Solid Cable (SQLite-backed)
│   ├── database.yml                  # SQLite databases
│   ├── routes.rb                     # API routes
│   └── deploy.yml                    # Kamal 2 deployment config
├── app/
│   ├── models/
│   │   ├── conversation.rb
│   │   ├── message.rb
│   │   └── push_subscription.rb
│   ├── channels/
│   │   ├── application_cable/
│   │   │   ├── connection.rb         # Auth + session token identification
│   │   │   └── channel.rb
│   │   ├── visitor_channel.rb        # Visitor chat channel
│   │   └── admin_channel.rb          # Admin dashboard channel
│   └── controllers/
│       ├── auth_controller.rb        # Login/logout endpoints
│       ├── conversations_controller.rb # REST API for conversations
│       └── push_subscriptions_controller.rb
├── db/
│   └── migrate/                      # Schema migrations
└── Dockerfile                        # Multi-stage production build
```

**Structure Decision**: The Rails app is a separate project (`chat-server/`) at the repository root. The Next.js frontend connects to it via ActionCable WebSocket and REST API. ActionCable handles real-time messaging; REST endpoints handle auth, conversation listing, and push subscriptions.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Separate `chat-server/` (Ruby) | Vercel cannot host WebSocket connections or Rails | Same-language Node.js server was rejected by user preference for Rails |
| Two runtimes (Ruby + TypeScript) | Rails for backend, Next.js for frontend | Single-runtime would require migrating the blog off Next.js/Vercel |
