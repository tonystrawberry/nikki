---
title: "POODR Chapter 4: Creating Flexible Interfaces"
date: "2026-07-15"
excerpt: "Designing the messages between objects — public vs private interfaces, asking for 'what' not 'how', context independence, and the Law of Demeter."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "interfaces", "law-of-demeter", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 4
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

The first three chapters focused on the design of individual classes — what objects *know*. Chapter 4 shifts to what objects *say to each other*. An application is defined as much by its patterns of messages as by its classes. This chapter is about designing **interfaces**: the messages an object is willing to receive.

## Two Kinds of Interface

The word "interface" here means the set of messages an object responds to. Every class has two:

- **Public interface** — the methods that make up the class's primary responsibility. They are stable, safe for others to depend on, and thoroughly tested. This is the class's "face" to the world.
- **Private interface** — internal implementation details. They may change without warning, are not meant to be called by others, and should not appear in tests written by outsiders.

A good public interface reveals *what* a class does while hiding *how* it does it. Think of a restaurant menu: it lists the meals you can order, not the recipes.

## Finding the Public Interface: Domain Objects vs Messages

The chapter uses a "run a bike tour" example (a `Customer` wants to see available trips of a certain difficulty). It's tempting to start by listing the obvious **domain objects** — `Customer`, `Trip`, `Bicycle`, `Mechanic`. Those nouns are real and easy to spot, but they're a trap: focusing on nouns makes you assign behavior to whichever class you noticed first, rather than to whichever class *should* own it.

Instead, **design the messages first.** Use sequence diagrams to ask: given this message, who should respond to it? This flips the question from "I know I need this class, what should it do?" to "I need to send this message, who should respond to it?" Designing the conversation reveals the objects — not the other way around.

> The key design question is not "what objects do I need?" but "what messages get sent, and who should respond to them?"

## Ask for "What", Not "How"

A crucial distinction: a message can ask an object *what* it wants (and trust the receiver to figure out how), or it can dictate *how* the receiver should do its job.

When a `Trip` tells a `Mechanic` exactly which steps to perform to prepare each bicycle, `Trip` is coupled to the mechanic's procedure — any change to how bikes are prepared forces `Trip` to change. Instead, `Trip` should send a single, intention-revealing message like `prepare_bicycles(bicycles)` and let `Mechanic` decide the steps. Trusting collaborators to fulfill requests, without micromanaging, is central to good object-oriented design.

## Seeking Context Independence

The **context** an object expects is everything it must know about its collaborators before it can function. The more context an object requires, the harder it is to reuse and test.

The goal is **context independence**: an object that knows *what* it wants but nothing about *how* other objects fulfill it. Dependency injection (from chapter 3) is the primary tool — a `Trip` that's handed a "preparer" and simply sends it `prepare_trip(self)` doesn't care whether the preparer is a mechanic, a driver, or a cook. Each collaborator asks the trip for whatever it needs.

## The Law of Demeter

The Law of Demeter (LoD) restricts which objects you may send messages to. It prohibits *train wrecks* — long chains of messages that reach through one object to talk to a distant one:

```ruby
customer.bicycle.wheel.tire      # violates LoD
customer.bicycle.wheel.rotate    # violates LoD
hash.keys.sort.join(', ')        # arguably fine — see below
```

The informal version: "only talk to your immediate neighbors," or "use only one dot." A method may send messages to `self`, to objects passed in as arguments, and to objects it directly creates — but it shouldn't go digging through the internals of one collaborator to reach another.

Not every chain violates the spirit of the law. `hash.keys.sort.join` is a chain, but each call returns the *same kind of thing* and doesn't reach into unrelated distant objects, so the coupling cost is low. What LoD really warns against is a message chain that reveals — and depends on — the internal structure of your collaborators.

Train wrecks are a *symptom*. The cure isn't to mechanically remove dots; it's to recognize that the chain betrays a missing message. Ask the first object for what you actually want, and let it delegate internally. This often surfaces a new, useful public method.

## Key Takeaways

1. **Distinguish public from private interfaces** — expose stable methods that reveal *what*, hide volatile methods that implement *how*.
2. **Design messages before objects** — use sequence diagrams and ask "who should respond to this message?"; the objects emerge from the conversation.
3. **Focus on messages, not domain nouns** — the obvious classes are a starting point, not the design.
4. **Ask for "what" you want, not "how" to get it** — send intention-revealing messages and trust collaborators.
5. **Seek context independence** so objects are easy to reuse and test; dependency injection is the main tool.
6. **Follow the Law of Demeter** — avoid message chains that reach through collaborators; a train wreck usually signals a missing public message.
