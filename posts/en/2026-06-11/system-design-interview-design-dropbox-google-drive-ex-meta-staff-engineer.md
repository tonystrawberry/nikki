---
title: "System Design Interview: Design Dropbox or Google Drive w/ a Ex-Meta Staff Engineer"
date: "2026-06-11"
excerpt: "Hello Interview's walkthrough of designing Dropbox / Google Drive — presigned-URL uploads direct to S3, chunking with fingerprints for resumable uploads, and syncing via polling, delta sync, and reconciliation."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "dropbox", "google-drive", "file-storage", "s3", "chunking", "fingerprinting", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=_UZ1ngy-kOI"
---

Another entry in Hello Interview's system-design series, run by Evan (ex-Meta staff engineer and interviewer who's asked this ~50 times). **Design Dropbox** — also asked as Design Google Drive — is popular at Google, Amazon, and Meta. It's on the **easier side**, asked most often of mid-level (E4/L4) candidates but also senior and staff, where the deep dives are what separate levels.

The repeatable roadmap: **requirements → core entities → API → high-level design → deep dives**.

## Requirements

- **Functional**: upload a file (to remote storage), download a file, and **automatically sync files across devices** (a local folder mirrors remote, in both directions). *Out of scope: rolling your own blob storage — "Design S3" is a separate question.*
- **Non-functional**: prioritize **availability over consistency** (CAP) — it's fine if someone in the US briefly sees an old version of a file changed in Germany; **low-latency** uploads/downloads; support **large files up to 50GB** with **resumable uploads**; and **high data integrity** (eventual consistency is OK, but once it settles, local and remote must match).

> A teaching aside: don't do back-of-the-envelope estimations up front here. Only estimate when the numbers will **directly change your design** — and with near-infinitely-scalable blob storage, they mostly won't.

## Core entities

- **File** — the raw bytes, stored in blob storage (S3).
- **FileMetadata** — file ID, name, MIME type, size, owner ID (FK to user), and the S3 link back to the bytes.
- **User** — least important; sometimes a distraction better left out early.

## API

- `POST /files` — body is the file + metadata; returns 200.
- `GET /files/{fileId}` — returns the file + metadata.
- `GET /changes?since={timestamp}` — returns the list of file IDs that changed (later: the full metadata, to save a round trip).

User ID rides in the **header** (JWT / session token), not the body. Evan flags up front that these endpoints are **deliberately "wrong"** — the real upload path emerges in the deep dives, and he comes back to fix them.

## High-level design

Client → **load balancer / API gateway** (auth, rate limiting, SSL termination, routing) → **File Service**, which writes bytes to **blob storage (S3)** and metadata to the **File Metadata DB**. The metadata row holds the **S3 link**.

- **Upload**: file → File Service → S3, then write metadata, return 200.
- **Download**: look up metadata by file ID, get the S3 link, and **download directly from S3** (don't proxy bytes back through the server).

### Sync — the interesting requirement

Unlike most designs, the **client is "fat"** and worth modeling: it holds the **local folder**, a **client app**, and a **local DB** (metadata + fingerprints, to know what's already downloaded). Two directions:

- **Remote changed** → the client **polls** `GET /changes` periodically and downloads new/changed files.
- **Local changed** → the OS notifies via native file-watch APIs (**Windows: FileSystemWatcher**, **macOS: FSEvents**); the app uploads via the normal path and updates the metadata.

## Deep dives

The deep dives exist to satisfy the **non-functional** requirements.

### Large files (50GB) + resumable uploads

The naive design only works for ~5–10MB files, for two reasons:

1. **Redundant upload path** — uploading bytes to the File Service *and then* to S3 wastes bandwidth and CPU.
2. **Request-body size limits** — browsers/servers/gateways cap body size (AWS API Gateway is ~10MB), so a 50GB file can't go through at all.

**Fix 1 — presigned URLs.** Send only the **metadata** to the File Service (set `status: started`), then request a **presigned URL** from S3. S3 returns a signed, time-limited link scoped to that MIME type and size; the client **uploads bytes directly to S3** with it.

**Fix 2 — chunking.** A 50GB file at ~100 Mbps takes ~1h12m, so don't make a failure restart from zero. **Chunk the file on the client** (~5MB chunks), upload chunks to S3 (serial or parallel), and track each chunk's status in metadata. To identify chunks uniquely, use **fingerprinting** — a hash of the chunk's bytes becomes the chunk ID. To resume, compare the client's fingerprints against the stored chunk list and re-upload only the missing ones. (Modeled in DynamoDB as a `chunks` list, each with `{ id: fingerprint, status, s3Link }`.)

**Updating chunk status securely.** Don't blindly trust the client's "chunk uploaded" claim — use **trust-but-verify**: client reports success, then the File Service **confirms with S3** before marking it complete. Alternative: **S3 notifications** (change data capture) push the event server-side. Note S3's native **multipart upload** does much of this (chunking, fingerprinting, validation) for you.

### Low-latency upload/download

- **Chunking already helps** — parallel chunk uploads with adaptive chunk sizes max out available bandwidth.
- **CDN** — the obvious add, but **think before adding it**: users mostly download **their own** files and are near their own data center, so a CDN rarely helps and is expensive. Worth it only for traveling users or very popular shared files.
- **Compression** — send fewer bytes, but **selectively**: text/DOCX compress well; already-compressed media (JPEG/PNG/MP4) gains little and isn't worth the compress/decompress cost. Decide on the client by file type + network; record the algorithm in metadata.

### High data integrity / sync accuracy

Two goals — **fast** and **consistent**:

- **Fast**: **adaptive polling** (poll more often when the app is open / active) beats WebSockets or long-polling, which are overkill for "updates within seconds." Plus **delta sync** — fetch only the **changed chunks** of a file, not the whole file, and let the client re-stitch it.
- **Consistent**: two options for detecting changes —
  - **Poll the DB directly** ("give me files in folder X with a chunk changed since my last sync") — simple, and what Evan picks.
  - **Event bus with a cursor** (e.g. Kafka) — each change is an event; a per-folder **sync cursor** marks the last event read. This is closer to what Dropbox actually does and enables **audit trail / versioning / rollback**, but it's **overkill** without those requirements.
- **Reconciliation**: despite best efforts, local and remote can drift, so periodically (daily/weekly) the client fetches remote state, compares fingerprints, and fixes inconsistencies.

Finally, he returns to **fix the API**: `POST /files` sends *metadata* and gets back a **presigned URL**; the client uploads **chunks** to that URL; then patches chunk status — matching what the deep dives revealed.

## Key takeaways

- **Separate bytes from metadata** — coordinate via the File Service, move bytes **directly to/from S3 via presigned URLs**.
- **Chunk + fingerprint** large files — the foundation for resumable uploads, parallelism, integrity, and **delta sync**.
- **Trust but verify** chunk status (or use S3 notifications); S3 multipart upload does much of this natively.
- **Sync = adaptive polling + delta sync**, with **reconciliation** as a safety net; WebSockets are overkill.
- **Question the CDN** and **compress selectively** — defaults aren't always right, and saying why is what scores.
- Justify depth by **level**: mid-level can stop after a solid high-level design; senior/staff must drive 2–3 deep dives.
