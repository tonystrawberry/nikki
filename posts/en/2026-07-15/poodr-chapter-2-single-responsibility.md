---
title: "POODR Chapter 2: Designing Classes with a Single Responsibility"
date: "2026-07-15"
excerpt: "Making classes do one thing — the SRP, the TRUE test, hiding instance variables behind methods, and isolating data structures so change stays cheap."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "single-responsibility", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 2
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Chapter 2 is about the first and most foundational goal: build classes that do one thing. A class with a **single responsibility** is easy to reuse and easy to change, because everything inside it changes for the same reason. This chapter uses the now-famous `Gear`/`Wheel` bicycle example to show how to find, isolate, and clean up responsibilities.

## Deciding What Belongs in a Class

The hard part of design early on isn't *how* to write a class but *what* to put in it. Metz's advice: it's more important to organize code so it's easy to change than to get the perfect design up front. Aim for code that is **TRUE**:

- **T**ransparent — the consequences of a change are obvious.
- **R**easonable — the cost of a change is proportional to its benefit.
- **U**sable — the code can be reused in new and unexpected contexts.
- **E**xemplary — the code encourages those who change it to perpetuate good habits.

The way you get there is by enforcing the **Single Responsibility Principle** (SRP): a class should do the smallest possible useful thing, and it should have only one reason to change.

## Why Single Responsibility Matters

A class that does too many things is hard to reuse — you can't grab just the behavior you want without dragging along everything else. When you're tempted to copy just a method into a new context, that's a smell that the class is doing more than one thing.

Tightly coupled responsibilities also make the class fragile: a change intended for one behavior can accidentally break an unrelated one.

## How to Tell If a Class Has a Single Responsibility

Two practical techniques:

1. **Interrogate it like a sentence.** Ask the class its methods and rephrase them as questions: "Please Mr. Gear, what is your `ratio`?" makes sense. "Please Mr. Gear, what is your `gear_inches`?" is borderline. "Please Mr. Gear, what is your `tire_size`?" clearly does not — tire size belongs to a wheel, not a gear.
2. **Describe it in one sentence.** If the simplest description uses the word "and," the class likely has more than one responsibility. If it uses "or," the responsibilities aren't even related. A good class description contains a single, cohesive purpose.

## Writing Code That Embraces Change

Even before you know the final design, you can write code that stays flexible.

### Depend on Behavior, Not Data

**Hide instance variables.** Never refer to `@variables` directly inside methods — wrap them in accessor methods so there's a single place the data is defined:

```ruby
class Gear
  attr_reader :chainring, :cog   # creates wrapper methods

  def initialize(chainring, cog)
    @chainring = chainring
    @cog = cog
  end

  def ratio
    chainring / cog.to_f   # use the method, not @chainring
  end
end
```

Now if the meaning of `cog` ever needs to change, you change one method instead of hunting down every reference.

**Hide data structures.** If a class receives a complex structure (say, an array of two-element arrays for wheels), don't scatter index references like `wheel[0]` and `wheel[1]` everywhere. Every reference depends on the structure's exact layout. Instead, wrap it in a `Struct` so each piece has a name:

```ruby
class ObscuringReferences
  attr_reader :data
  def initialize(data)
    @data = data
  end

  def diameters
    data.collect { |cell| cell[0] + (cell[1] * 2) }  # what is [0]? [1]?
  end
end

class RevealingReferences
  attr_reader :wheels
  def initialize(data)
    @wheels = wheelify(data)
  end

  def diameters
    wheels.collect { |wheel| wheel.rim + (wheel.tire * 2) }  # clear!
  end

  Wheel = Struct.new(:rim, :tire)
  def wheelify(data)
    data.collect { |cell| Wheel.new(cell[0], cell[1]) }
  end
end
```

The structure now lives in exactly one place.

## Enforce Single Responsibility Everywhere

The same discipline applies below the class level:

- **Extract extra responsibilities from methods.** Methods, like classes, should do one thing. Small, single-purpose methods expose hidden qualities of the class, avoid comments, and are easy to reuse and move.
- **Isolate extra responsibilities in classes.** When a method or embedded structure hints at a new concept (like `Wheel` living inside `Gear`), extract it — even into a small `Struct` at first. You don't have to commit to a full new class immediately; just isolate the idea so it's ready to move when the time comes.

The payoff: the eventual `Wheel` class practically writes itself, because the responsibility was already cleanly isolated.

## Key Takeaways

1. **A class should have a single responsibility** — one reason to change — which makes it reusable and safe to modify.
2. **Test for SRP** by interrogating methods as questions and describing the class in one sentence; watch out for "and" and "or."
3. **Aim for TRUE code**: Transparent, Reasonable, Usable, Exemplary.
4. **Hide instance variables behind accessor methods** so data has a single definition point.
5. **Hide complex data structures** (e.g. with `Struct`) so references don't depend on layout.
6. **Enforce single responsibility in methods too** — small, focused methods make future extraction and reuse cheap.
7. **Isolate emerging responsibilities early**, even before you're ready to create a full new class.
