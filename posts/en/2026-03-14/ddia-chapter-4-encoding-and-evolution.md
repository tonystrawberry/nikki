---
title: "DDIA Chapter 4: Encoding and Evolution"
date: "2026-03-14"
excerpt: "Summary of Kleppmann's chapter on data encoding formats, schema evolution, and compatibility in data-intensive systems."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "encoding", "schema", "evolution"]
coverImage: ""
collection: "ddia"
collectionOrder: 4
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

Chapter 4 of *Designing Data-Intensive Applications* focuses on how data is encoded (serialized) and how systems can evolve over time without breaking. Applications change constantly; the ability to roll out new code and change schemas without downtime or data loss depends on encoding choices and compatibility guarantees.

## Language-Specific and Textual Formats

- **Language-specific** (Java serialization, Python pickle): convenient but tie you to one language, have security and versioning pitfalls, and are a bad fit for cross-service or persistent storage.
- **JSON, XML, CSV**: human-readable and widely supported, but weak typing (numbers vs strings), no schema, and verbose. JSON is the default for APIs; XML is heavier; CSV is flattest and brittle for nested data.

**Example — same data in JSON vs CSV:** JSON supports nesting and types; CSV flattens and loses structure.

```json
{
  "user_id": 42,
  "name": "Alice",
  "preferences": { "theme": "dark", "notifications": true }
}
```

```csv
user_id,name,preferences.theme,preferences.notifications
42,Alice,dark,true
```

CSV column names become ambiguous with nesting; numbers can be confused with strings; no standard for null/empty.

## Binary Encoding and Schema-Based Formats

For high throughput or large datasets, binary encodings save space and parse time. Schema-based formats give structure and evolution semantics:

- **Protocol Buffers (Protobuf)** and **Thrift**: require a schema; generate code; encode by field tag (number). New fields can be added; old readers ignore unknown tags. Renaming in the schema only changes generated code—on-the-wire tag numbers stay the same, so you can’t truly “rename” a field for existing data.
- **Avro**: schema-based binary format with two schemas in play—writer’s and reader’s. Schema is often stored alongside the data (e.g. in a file header or registry). No field tags; encoding is positional, so field order and compatibility rules matter. Good fit for evolving log/event pipelines and data lakes.

Common idea: the **schema** defines the contract; the encoding is compact and predictable. Evolution is done by compatibility rules (add optional fields, avoid removing required fields, etc.).

### Protocol Buffers example

The schema defines **field tags** (1, 2, 3…). Those numbers are what get encoded on the wire—not the field names. Adding a new optional field with a new tag is backward and forward compatible.

```protobuf
// person.proto (v1)
message Person {
  required string name = 1;
  required int64 id = 2;
  optional string email = 3;
}

// Later (v2): add optional field — old readers ignore tag 4
message Person {
  required string name = 1;
  required int64 id = 2;
  optional string email = 3;
  optional string phone = 4;   // NEW: new code can set it, old code ignores
}
```

Never reuse a tag number for a different field; old data might still have that tag. “Renaming” a field in the schema only changes generated code—wire format stays the same.

### Avro example

Avro uses **positional** encoding and explicit writer/reader schemas. The reader schema is used to resolve differences (e.g. “field added in writer, missing in reader” → ignore; “field added in reader, missing in writer” → use default).

```json
// User record schema (writer)
{
  "type": "record",
  "name": "User",
  "fields": [
    { "name": "id", "type": "long" },
    { "name": "username", "type": "string" },
    { "name": "email", "type": ["null", "string"], "default": null }
  ]
}
```

Binary encoding is compact: no field names, just values in order. To add a field, add it with a default so old data can be read (reader supplies default when writer didn’t have the field).

## Schema Evolution and Compatibility

- **Backward compatibility**: new code can read data written by old code (e.g. new server reads old messages). Usually means “add optional fields only” or “don’t remove fields.”
- **Forward compatibility**: old code can read data written by new code (e.g. old client reads new server response). Usually means “ignore unknown fields” and “don’t require fields that didn’t exist before.”

With Protobuf/Thrift/Avro you get both by following conventions: add optional fields, use defaults, and never remove or repurpose required fields without a multi-phase rollout.

**Compatibility over time:**

```
Backward compatibility (new reader, old data):
  OLD WRITER ──► [old bytes] ──► NEW READER  ✓  (new code understands old format)

Forward compatibility (old reader, new data):
  NEW WRITER ──► [new bytes] ──► OLD READER  ✓  (old code ignores unknown fields)
```

**What breaks compatibility:**

| Change | Backward? | Forward? |
|--------|-----------|----------|
| Add optional field | ✓ | ✓ |
| Remove required field | ✗ (new reader expects it) | ✓ (old reader didn’t need it) |
| Add required field | ✓ | ✗ (old reader can’t provide it) |
| Rename field (same tag/position) | ✓ | ✓ (names not on wire) |
| Change field type | Often ✗ | Often ✗ |

## Modes of Data Flow

Encoding and evolution play out differently by context:

- **Databases**: writer = process that writes a row, reader = process that reads it later (often same app, possibly newer version). Schema migrations (add column, backfill) are a form of evolution; keeping backward/forward compatibility avoids big-bang deploys.
- **RPC and REST**: client and server can be different versions. Backward compatibility (new server, old client) and forward compatibility (old server, new client) both matter; versioned APIs or careful schema evolution reduce breakage.
- **Message-passing / async**: producers and consumers are decoupled; messages may be replayed or read by new consumers months later. Strong compatibility and clear schema evolution (e.g. Avro in a schema registry) are critical.

**How data flows in each mode:**

```
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE                                                         │
│  App v1 writes row  ──►  [storage]  ──►  App v2 reads row       │
│  (same process over time, or new deployment reading old rows)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RPC / REST                                                       │
│  Client (old or new)  ◄──►  Server (old or new)                  │
│  Both directions must tolerate unknown fields / optional fields  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MESSAGE PASSING (e.g. Kafka, queue)                              │
│  Producer v2  ──►  [log]  ──►  Consumer v1 (or new Consumer v3)  │
│  Messages may be read months later; schema registry + Avro      │
│  let readers resolve writer schema vs reader schema              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Takeaways

- Use **schema-based** binary formats (Protobuf, Avro, Thrift) when you care about performance, clarity, and safe evolution; avoid opaque or language-specific serialization for cross-service or persistent data.
- Design for **backward and forward compatibility** from the start: optional fields, no removal of required fields, and “ignore unknown fields” behavior.
- **Avro** is well-suited to event streams and data lakes where reader and writer schemas can differ and the schema is stored with or next to the data.
- **Protobuf and Thrift** are great for RPC and service-to-service APIs where you control both ends and want code generation and clear versioning.
- The same compatibility thinking applies to **databases**: schema changes (new columns, new tables) should be backward and forward compatible when you can’t afford downtime or bulk rewrites.
