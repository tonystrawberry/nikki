---
title: "POODR Chapter 3: Managing Dependencies"
date: "2026-07-15"
excerpt: "Recognizing, isolating, and inverting dependencies — dependency injection, depending on abstractions, and choosing the direction dependencies should point."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "dependencies", "dependency-injection", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 3
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Since objects must collaborate to do anything useful, dependencies are unavoidable. Chapter 3 is about keeping those dependencies under control: recognizing when they exist, minimizing them, and — most importantly — arranging them so that each class depends on things less likely to change than itself.

## Recognizing Dependencies

An object has a dependency on another when, if that other object changes, this object might be forced to change too. Metz lists four kinds of dependencies an object should avoid knowing:

1. **The name of another class.** (`Gear` expects a class named `Wheel` to exist.)
2. **The name of a message it intends to send** to something other than `self`. (`Gear` expects `Wheel` to respond to `diameter`.)
3. **The arguments a message requires.** (`Gear` knows `Wheel.new` needs a `rim` and a `tire`.)
4. **The order of those arguments.** (`Gear` knows `rim` comes before `tire`.)

Each piece of knowledge couples the two classes. Some coupling is necessary, but every unnecessary dependency makes the class harder to change and reuse.

Here's the tightly coupled starting point:

```ruby
class Gear
  def initialize(chainring, cog, rim, tire)
    @chainring = chainring
    @cog = cog
    @rim = rim
    @tire = tire
  end

  def gear_inches
    ratio * Wheel.new(rim, tire).diameter   # too many dependencies!
  end
end
```

`Gear` knows the *class name* `Wheel`, the *message* `diameter`, and the *arguments* (and their *order*) that `Wheel.new` needs.

## Coupling Between Objects

The more `Gear` knows about `Wheel`, the more tightly the two are coupled. Tightly coupled objects behave like a single entity — you can't reuse or test one without dragging in the other, and a change to one ripples into the other. The techniques below loosen that coupling.

## Writing Loosely Coupled Code

### Inject Dependencies

Instead of hard-coding the `Wheel` class name inside `Gear`, pass a wheel object in. `Gear` doesn't need to know *what kind* of object it holds — only that it responds to `diameter`:

```ruby
class Gear
  attr_reader :chainring, :cog, :wheel
  def initialize(chainring, cog, wheel)
    @chainring = chainring
    @cog = cog
    @wheel = wheel
  end

  def gear_inches
    ratio * wheel.diameter   # any object that responds to `diameter`
  end
end

Gear.new(52, 11, Wheel.new(26, 1.5)).gear_inches
```

This is **dependency injection**. `Gear` is now decoupled from `Wheel` and works with anything "duck-like" enough to answer `diameter`.

### Isolate Dependencies

If you can't remove a dependency, isolate it so it's visible and contained.

- **Isolate instance creation.** If you truly can't inject the object, at least create it in the `initialize` method (or a dedicated method) rather than deep inside a business-logic method like `gear_inches`.
- **Isolate vulnerable external messages.** Wrap messages sent to other objects in your own method, so an external change touches one place:

```ruby
def gear_inches
  ratio * diameter
end

def diameter
  wheel.diameter   # the one place that knows wheel responds to `diameter`
end
```

### Remove Argument-Order Dependencies

Fixed-order positional arguments are brittle — reorder the constructor and every caller breaks. Use **keyword arguments** so order stops mattering and each argument is named at the call site:

```ruby
class Gear
  def initialize(chainring:, cog:, wheel:)
    @chainring = chainring
    @cog = cog
    @wheel = wheel
  end
end

Gear.new(chainring: 52, cog: 11, wheel: Wheel.new(26, 1.5))
```

When you don't own the class whose arguments are fixed-order, wrap it in a **factory method** that hides the ordering, so the dependency lives in one place.

## Managing Dependency Direction

Every dependency has a direction — you can usually flip it. `Gear` could depend on `Wheel`, or `Wheel` could depend on `Gear`. How do you choose?

**Depend on things that change less often than you do.** Three ideas guide the choice:

- Some classes are **more likely to change** than others.
- Some are **depended on by many** other classes (they have many dependents).
- It's dangerous to depend on a class that is both **likely to change** *and* **widely depended upon** — a change there causes widespread breakage.

The rule of thumb: **depend in the direction of stability.** Abstractions are more stable than concretions, so depend on abstractions. Framework classes and mature libraries change less than your own volatile application code, so it's usually safe to depend on them.

## Key Takeaways

1. **A dependency exists when a change in one object may force a change in another** — watch for knowledge of class names, message names, and argument lists/order.
2. **Inject dependencies** so a class depends on a *message* (a role), not a concrete *class*.
3. **Isolate dependencies** you can't remove — contain instance creation and external messages in dedicated methods.
4. **Remove argument-order dependencies** with keyword arguments; wrap external fixed-order constructors in factory methods.
5. **Manage the direction of dependencies**: depend on things that are more stable and less likely to change than you are.
6. **Depend on abstractions, not concretions** — this is the Dependency Inversion idea in practice.
