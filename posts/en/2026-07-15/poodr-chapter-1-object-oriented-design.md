---
title: "POODR Chapter 1: Object-Oriented Design"
date: "2026-07-15"
excerpt: "Why design matters — the true cost of change, treating software as an arrangement of message-passing objects, and design as the art of managing dependencies."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "software-design", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 1
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Chapter 1 frames the whole book. Sandi Metz argues that design isn't about following rigid rules or applying patterns for their own sake — it's about arranging code so that it's cheap to change *today* and *tomorrow*. The chapter sets up the vocabulary and mindset for everything that follows.

## Why Design Matters

Software has two jobs: it must work now, and it must be easy to change later. Getting it to work is the obvious part. The hidden, expensive part is *change* — requirements shift, features get added, bugs get fixed. Most of the cost of software happens after the first version ships.

The problem is that applications that are easy to write are often hard to change, and vice versa. Well-designed applications absorb change gracefully; poorly-designed ones become progressively more expensive to touch until, eventually, the cost of change makes the whole thing feel not worth it.

> Design is the art of arranging code.

## The Cost of Change

Metz reframes design as **an economic problem**. You want the *net present cost* of your software — build plus all future changes — to be as low as possible. Two failure modes both cost you:

- **Under-designing** (no design at all): the code becomes a swamp of dependencies where every change breaks something unexpected.
- **Over-designing**: you anticipate the future with elaborate abstractions that never pay off, and the speculative complexity gets in the way.

The goal is design that is *just enough*, applied when the need is real rather than imagined.

## What Object-Oriented Design Is Really About

An object-oriented application is made of **objects** that send **messages** to one another. The surprising insight: the messages are actually more important than the objects. What matters is not just what each object knows and does, but how objects talk to each other.

The trouble is **dependencies**. When one object knows too much about another, they become entangled: changing one forces you to change the other. A single object with too many dependencies is fragile, and a web of over-connected objects resists all change.

> Object-oriented design is, fundamentally, about managing dependencies.

Design is a set of techniques for arranging code so that objects tolerate change. When dependencies are controlled, objects can evolve independently.

## Tools of the Trade: Principles and Patterns

Metz points to two bodies of knowledge that inform good design:

- **Principles** — most famously **SOLID**:
  - **S**ingle Responsibility
  - **O**pen/Closed
  - **L**iskov Substitution
  - **I**nterface Segregation
  - **D**ependency Inversion

  Plus supporting ideas like **DRY** (Don't Repeat Yourself) and the **Law of Demeter**. These are distilled, named guidelines backed by experience and research.

- **Patterns** — the *Gang of Four* design patterns: named, reusable solutions to common problems. Patterns are valuable, but only when applied to the problem they were designed for. Misapplied patterns become part of the problem.

The rest of the book is about applying these ideas pragmatically, in real Ruby code.

## A Brief Note on Ruby's Object Model

The chapter closes with a short reminder of what "class" means in Ruby: classes are blueprints for objects, objects respond to messages, and everything (numbers, strings, `nil`) is an object. Ruby's flexibility gives you great power to write beautiful code — and equally great power to write a tangled mess. Design is what keeps you on the right side of that line.

## Key Takeaways

1. **The purpose of design is to reduce the cost of change** — treat it as an economic decision, not a ritual.
2. **Applications are objects passing messages**; the arrangement of those messages is the real design.
3. **Dependencies are the enemy** — object-oriented design is the discipline of managing them.
4. **Both under-design and over-design cost you** — aim for "just enough" design, driven by real needs.
5. **Principles (SOLID, DRY, Law of Demeter) and patterns** are tools, valuable only when applied thoughtfully.
6. **Ruby gives you freedom**; design is how you keep that freedom from becoming chaos.
