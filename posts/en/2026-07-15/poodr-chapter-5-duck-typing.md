---
title: "POODR Chapter 5: Reducing Costs with Duck Typing"
date: "2026-07-15"
excerpt: "Across-class interfaces defined by behavior, not class — recognizing hidden ducks behind case-on-class and responds_to? checks, and trusting objects by what they do."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "duck-typing", "polymorphism", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 5
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Chapter 4 was about the interface of a single class. Chapter 5 is about interfaces that span *across* classes — interfaces defined not by which class an object is, but by what messages it responds to. These are **duck types**, and they are one of the most powerful tools for reducing the cost of change in a dynamically typed language like Ruby.

## What Duck Typing Is

"If it walks like a duck and quacks like a duck, it's a duck." In Ruby, an object's type is determined by what it *does*, not by its class. A duck type is a **public interface that is not tied to any specific class** — any object that implements the expected messages can play the role, regardless of its actual class.

Because Ruby doesn't check types at compile time, you're free to design objects around the *messages they respond to*. When you see a set of objects that all respond to the same message, you've found a duck type — a role that many classes can play. Depending on that role, rather than on concrete classes, dramatically loosens coupling.

## Recognizing Hidden Ducks

The clearest signal that a duck type is *missing* is code that switches on class. Metz names several patterns to watch for:

### `case` statements that switch on class

```ruby
class Trip
  attr_reader :bicycles, :customers, :vehicle

  def prepare(preparers)
    preparers.each do |preparer|
      case preparer
      when Mechanic
        preparer.prepare_bicycles(bicycles)
      when TripCoordinator
        preparer.buy_food(customers)
      when Driver
        preparer.gas_up(vehicle)
        preparer.fill_water_tank(vehicle)
      end
    end
  end
end
```

This code asks "what class are you?" and then decides which message to send. Every new preparer forces another `when` clause. It's rigid and destined to grow.

### `kind_of?` and `is_a?`

Checking `preparer.kind_of?(Mechanic)` is the same problem in a different disguise — it couples the caller to concrete classes.

### `responds_to?`

```ruby
if preparer.responds_to?(:prepare_bicycles)
  # ...
elsif preparer.responds_to?(:buy_food)
```

This looks more "duck-like" because it checks behavior, but it still enumerates specific classes' behavior and controls them from the outside. It's less coupled than checking class, but it still knows too much.

All three patterns share a root cause: the sender knows too much about the specific classes of its collaborators, and it's dictating behavior instead of trusting objects.

## Finding and Trusting the Duck

The fix is to recognize the underlying role. All the preparers share one abstraction: they can each **prepare a trip**. Define a duck type — a `Preparer` role with a single message, `prepare_trip` — and let each class implement it its own way:

```ruby
class Trip
  attr_reader :bicycles, :customers, :vehicle

  def prepare(preparers)
    preparers.each { |preparer| preparer.prepare_trip(self) }
  end
end

class Mechanic
  def prepare_trip(trip)
    trip.bicycles.each { |bicycle| prepare_bicycle(bicycle) }
  end
end

class TripCoordinator
  def prepare_trip(trip)
    buy_food(trip.customers)
  end
end

class Driver
  def prepare_trip(trip)
    vehicle = trip.vehicle
    gas_up(vehicle)
    fill_water_tank(vehicle)
  end
end
```

The `case` statement is gone. `Trip` now depends on the abstract `Preparer` duck type, not on `Mechanic`, `Driver`, or `TripCoordinator`. Adding a new kind of preparer requires *zero* changes to `Trip` — it just needs to respond to `prepare_trip`. This is **polymorphism**: many objects responding to the same message, each in its own way.

## The Trade-offs of Dynamic Typing

Duck typing is only possible because Ruby is dynamically typed. Metz addresses the perennial static-vs-dynamic debate directly:

- **Static typing** promises the compiler catches type errors and documents the code. But it trades away the flexibility that makes ducks possible.
- **Dynamic typing** lets you write concise, flexible code and metaprogram freely, at the cost of compile-time guarantees.

The pragmatic stance: since Ruby *is* dynamically typed, embrace it. Trust that your objects respond to the messages you send. This trust — depending on abstract interfaces rather than concrete classes — is what makes the code flexible and cheap to change.

## Key Takeaways

1. **Duck types are public interfaces unrelated to any specific class** — an object's type is defined by what it does, not what it is.
2. **`case`-on-class, `kind_of?`/`is_a?`, and `responds_to?` checks are clues** that a duck type is hiding, waiting to be named.
3. **Replace class checks with a shared role**: define the abstract interface and let each class implement it polymorphically.
4. **Depending on a duck type decouples you from concrete classes**, so new implementers can be added without changing existing code.
5. **Duck typing relies on trust** — send the message and trust the receiver to respond appropriately.
6. **Embrace Ruby's dynamic typing** rather than fighting it; the flexibility it offers is a feature, not a bug.
