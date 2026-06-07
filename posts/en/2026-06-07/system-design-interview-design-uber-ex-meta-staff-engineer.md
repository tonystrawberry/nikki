---
title: "System Design Interview: Design Uber w/ a Ex-Meta Staff Engineer"
date: "2026-06-07"
excerpt: "Hello Interview's walkthrough of designing Uber — the hardest of the proximity-search problems — covering quad-tree geospatial indexing, taming location-update throughput, and consistent driver matching."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "uber", "geospatial", "quadtree", "postgis", "dynamodb", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=lsKU38RKQSo"
---

The second entry in Hello Interview's system-design series (after Design Ticketmaster), run by an ex-Meta staff engineer and interviewer. Designing Uber is presented as the **hardest of the proximity-search problems** — nail it and you can handle Find My Friends, Yelp, and similar — and it's asked a lot at Tesla, Google, and Meta.

The video follows a repeatable roadmap for any user-facing system design: **requirements → core entities → API → high-level design → deep dives**, aiming to be ~15 minutes into the high-level design so there's room for deep dives at the end.

## Requirements

- **Functional** (the features): riders can input a destination and get fare estimates; riders can request a ride and get matched to a nearby driver; drivers can accept/decline and navigate to the rider.
- **Non-functional** (the qualities): low-latency matching (ideally under ~1 minute), high throughput for constant driver location updates, strong consistency for matching (no double-booking), and high availability.

## Core entities

Instead of a full schema this early, sketch the objects that get persisted (roughly one-to-one with tables/collections):

- **Rider**
- **Driver** — with metadata (car, license plate, photo) and a **status**: `available`, `in_ride`, or `offline`.
- **Ride**
- **Location** — holds the most up-to-date position of every driver, so matching can query by proximity.

## API

REST endpoints derived from the entities and functional requirements (fare estimate, request ride, accept ride, update location), with auth via a JWT/session token in the request header.

## High-level design

Walk each API through the system:

- A **Ride Matching Service** finds drivers within proximity, filters to `available`, and asks them one by one to accept.
- A **Location Service + Location DB** ingests frequent driver location pings and answers proximity queries.
- A **Notification Service** (black-boxed — itself an interview question) pushes "accept this ride?" prompts to drivers via native push (APNs / Firebase). On accept, the driver's app calls back to confirm the match.

## Deep dives

### Geospatial indexing (quad tree / PostGIS)

A naive "scan all drivers and compute distance" is far too slow. Introduce a **geospatial index** — a **quad tree** — which recursively splits the map into four regions until each cell holds fewer than some K drivers. This makes proximity queries efficient. With Postgres you get this via the **PostGIS** extension.

### Taming location-update throughput

Constant pings from every driver can hit something like **~600K TPS**, which is wasteful. Use **dynamic location updates**: have the driver app vary its update frequency based on context — speed, whether the car is parked (no movement → no updates), and proximity to ride requests / hot areas (less precision needed out in the boonies). This can cut the write load dramatically.

### Consistency of matching

Two invariants: no driver gets more than one ride, and no ride goes to more than one driver. Solve with a **lock on the driver** while a match is pending. A clean option is **DynamoDB** (few relations, high availability, scales well) with a **driver-lock table** using a **TTL** on rows so stale locks auto-expire — reusing the same database as the lock rather than adding a separate Redis instance.

## Key takeaways

- **Follow the roadmap**: requirements → entities → API → high-level design → deep dives; budget time so deep dives get real attention.
- **Model a Location entity** separate from Driver so proximity matching stays fast.
- **Quad tree + PostGIS** is the standard answer for geospatial/proximity search.
- **Dynamic, context-aware location updates** are the lever for cutting write throughput.
- **Lock the driver (e.g. DynamoDB with TTL)** to keep matching consistent without double-booking.
- The same proximity-search pattern generalizes to Find My Friends, Yelp, and friends.
