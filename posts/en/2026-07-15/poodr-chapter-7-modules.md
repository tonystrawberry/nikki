---
title: "POODR Chapter 7: Sharing Role Behavior with Modules"
date: "2026-07-15"
excerpt: "Sharing behavior across unrelated classes with Ruby modules — recognizing roles, writing inheritable module code, understanding method lookup, and the rules of well-behaved inheritance (Liskov, hooks, shallow hierarchies)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "modules", "roles", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 7
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Chapter 6 used classical inheritance to share behavior between classes that are variations of the same *thing* (a `RoadBike` **is a** `Bicycle`). But sometimes several otherwise-unrelated objects need to play the same **role** — they all need to *do* the same thing without *being* the same thing. Chapter 7 covers sharing that role behavior with **Ruby modules** (mixins), and then lays out the rules that make *any* inheritance — classical or module-based — trustworthy.

## Understanding Roles

Some problems require unrelated objects to respond to the same message. That shared responsibility is a **role**. A duck type (chapter 5) is a role defined by an interface; this chapter is about roles that also come with *shared code*.

A word of caution up front: **using a role creates dependencies**, and those dependencies raise the risk of your design. Roles are powerful but should be used deliberately, not reflexively.

## Finding Roles

The example: a scheduler needs to know whether a target (a `Bicycle`, a `Mechanic`, a `Vehicle`) is available during a proposed time span, respecting a "lead time" between bookings. Every schedulable thing must answer `schedulable?`, and they all share the same lead-time logic — but bikes, mechanics, and vehicles are otherwise unrelated.

This is a **`Schedulable` role**. The interface plus its shared behavior belongs in a module that any class can include.

## Writing the Code That Uses a Role — Modules

In Ruby, a **module** holds a named set of methods that can be mixed into any class with `include`. Once included, the module's methods become available to instances of that class *as if they were defined there* — the object gains the behavior.

```ruby
module Schedulable
  attr_writer :schedule

  def schedule
    @schedule ||= ::Schedule.new
  end

  def schedulable?(start_date, end_date)
    !scheduled?(start_date - lead_days, end_date)
  end

  def scheduled?(start_date, end_date)
    schedule.scheduled?(self, start_date, end_date)
  end

  # includers may override; template-method style default
  def lead_days
    0
  end
end

class Bicycle
  include Schedulable

  def lead_days
    1
  end
end
```

`Schedulable` defines the *algorithm* (`schedulable?` → `scheduled?`) and exposes a **hook** (`lead_days`) with a sensible default. Each includer specializes only what's different. This is exactly the template-method pattern from chapter 6, now applied through a module instead of a superclass.

## Method Lookup and the Antipatterns

When an object receives a message, Ruby searches for the matching method in a specific order:

1. the object's own **class**,
2. any **modules** that class included (last included is searched first),
3. the **superclass**,
4. the superclass's included modules,
5. …up the chain to `Object`, `Kernel`, and `BasicObject`.

Because included modules are inserted into this lookup path, mixing a module in is a form of inheritance — the same rules and risks apply.

Two **antipatterns** signal that you should reach for a role or an abstraction:

- An object that uses a **variable with a name like `type` or `category`** to decide what message to send to `self` → the classes probably share a role; consider classical inheritance for the *is-a* part and modules for the *behaves-as* part.
- A message sender that **checks the class of the receiver** to decide which message to send → you're missing a duck type; the receivers share a role, and that role's interface (and possibly shared code) belongs in a module.

## Writing Inheritable Code

The final section gives rules that apply to **all** inheritance, whether via superclasses or modules. These are what make a hierarchy safe to build on.

### Recognize the Antipatterns
(as above) — they tell you *when* sharing code is appropriate.

### Insist on the Abstraction
All code in an abstract superclass or a module must apply to **every** object that inherits it. Never put code there that only *some* includers need. If a subclass or includer overrides a method to raise an error ("does not implement this"), that's proof the abstraction is wrong — the method didn't belong in the shared code.

### Honor the Contract — Liskov Substitution Principle
Subclasses and includers must be **substitutable** for the thing they specialize. A subclass should honor the same interface and behave in a way callers expect — accepting the same kinds of inputs and returning the same kinds of outputs. This is the **Liskov Substitution Principle (LSP)**, the "L" in SOLID. Violating it means callers must know which concrete type they're dealing with, which defeats the entire point of the abstraction.

### Use the Template Method Pattern
Separate the abstract (the shared algorithm) from the concrete (the per-includer specialization) by having the shared code send messages that includers implement — with defaults provided in the shared code.

### Preemptively Decouple Classes — Avoid `super` in Includers
Wherever possible, avoid writing code that requires includers/subclasses to send `super`. Use **hook methods** instead, so specializations plug into the algorithm without needing to know it. This keeps the shared code in control of *when*, and includers in control of *what*.

### Create Shallow Hierarchies
Deep, wide inheritance hierarchies are hard to understand and expensive to change — method lookup travels far, and it's difficult to reason about where behavior comes from. Prefer **shallow, narrow** hierarchies. They're easier to comprehend and far less risky to extend.

## Key Takeaways

1. **Modules let unrelated classes share a role** — common behavior for objects that *do* the same thing without *being* the same thing.
2. **Using a role introduces dependencies**, so apply modules deliberately, not by default.
3. **Including a module is a form of inheritance** — modules join the method-lookup path, so all inheritance rules apply to them too.
4. **Apply the template-method pattern in modules**: define the algorithm, expose hooks with sensible defaults, and let includers specialize.
5. **Insist on the abstraction** — shared code must apply to *every* includer; an override that raises "not implemented" means the abstraction is wrong.
6. **Honor the Liskov Substitution Principle** — includers/subclasses must be substitutable for the abstraction they extend.
7. **Avoid forcing `super`, and keep hierarchies shallow and narrow** to minimize coupling and cognitive load.
