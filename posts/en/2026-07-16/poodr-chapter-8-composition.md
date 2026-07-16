---
title: "POODR Chapter 8: Combining Objects with Composition"
date: "2026-07-16"
excerpt: "Building objects out of parts — composition vs inheritance, the has-a relationship, modeling with factories and roles, and how to choose between inheritance, modules, and composition."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "composition", "inheritance", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 8
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

**Composition** is the act of combining distinct parts into a whole such that the whole becomes *more* than the sum of its parts. In software, it means building larger objects out of smaller ones by *having* them, rather than *being* them. Chapter 8 rebuilds the bicycle example one more time — this time with composition instead of inheritance — and then steps back to give concrete guidance on when to use inheritance, modules, or composition.

## Composing a Bicycle of Parts

The earlier chapters modeled bike variants (`RoadBike`, `MountainBike`) with an inheritance hierarchy. But the thing that actually varies between bikes is their **parts**. So instead of asking "what kind of bike is this?", composition asks "what parts does this bike have?"

The refactoring proceeds in stages:

1. A `Bicycle` **has a** `Parts` object, and delegates `spares` to it.

```ruby
class Bicycle
  attr_reader :size, :parts

  def initialize(size:, parts:)
    @size = size
    @parts = parts
  end

  def spares
    parts.spares
  end
end
```

Now `Bicycle` is tiny. It's responsible for `size` and holds a `Parts` object, forwarding the `spares` message to it. Different bikes are just a `Bicycle` combined with a different `Parts`.

## The Parts Object → a Collection of Part Objects

`Parts` starts as a class that knows about individual pieces, but the natural next step is to recognize that `Parts` is really a **collection of `Part` objects**. Each `Part` has a `name`, a `description`, and whether it `needs_spare`.

```ruby
class Parts
  attr_reader :parts
  def initialize(parts)
    @parts = parts
  end

  def spares
    parts.select { |part| part.needs_spare }
  end
end

class Part
  attr_reader :name, :description, :needs_spare
  def initialize(name:, description:, needs_spare: true)
    @name = name
    @description = description
    @needs_spare = needs_spare
  end
end
```

`Parts` now behaves almost like an array — which raises a useful question about whether it *should* be array-like (see below).

## The Parts Factory

Manually constructing every `Part` object is tedious and error-prone. A **factory** — an object whose job is to manufacture other objects — encapsulates the knowledge of how to build a valid `Parts` from simple configuration data:

```ruby
module PartsFactory
  def self.build(config, part_class = Part, parts_class = Parts)
    parts_class.new(
      config.collect { |part_config| part_class.new(
        name: part_config[0],
        description: part_config[1],
        needs_spare: part_config.fetch(2, true))
      })
  end
end

road_config = [
  ['chain', '10-speed'],
  ['tire_size', '23'],
  ['tape_color', 'red']
]

road_bike = Bicycle.new(size: 'L', parts: PartsFactory.build(road_config))
```

The factory concentrates all knowledge of the configuration structure in one place. Because the `Part` objects the factory produces are so simple (they just hold data and answer `needs_spare`), you could even replace the `Part` class with a `Struct` created inside the factory — the rest of the code wouldn't care, because it only depends on the *Part duck type* (responds to `name`, `description`, `needs_spare`).

## Aggregation: Composition vs. a Looser "Has-A"

Composition, strictly speaking, implies that the whole *controls the life cycle* of its parts — the parts have no independent existence (a paragraph is part of exactly one document). A looser relationship where the parts can exist independently (a university *has* departments, but departments and professors outlive any single arrangement) is called **aggregation**. The distinction is subtle; in practice both are modeled the same way in Ruby — via has-a relationships and delegation.

## Deciding Between Inheritance and Composition

This is the heart of the chapter. Metz's guiding rule:

> Use **inheritance** for *is-a* relationships; use **composition** for *has-a* relationships.

Each approach has real costs and benefits.

### Benefits and Costs of Inheritance

Well-designed inheritance gives you code that is:

- **Reasonable** — a small change in the superclass yields large, correct changes across subclasses (via the template method pattern).
- **Usable** — new subclasses require only their specialized differences.
- **Exemplary** — the pattern invites new subclasses to be added correctly.

But inheritance is a poor choice when:

- The hierarchy is wrong (you're forced to override methods to *cancel* behavior), or
- You might be tempted to reach across the hierarchy for behavior that doesn't belong to your branch.

The great weakness: the cost of being *wrong* is high, and inheritance is a commitment. It's best when you're modeling objects that clearly share a stable, general-to-specific relationship.

### Benefits and Costs of Composition

Composed objects tend to be:

- **Transparent** and easy to reason about — small objects with clear responsibilities and straightforward, well-defined interfaces.
- **Flexible** — you can swap out one part for another that plays the same role, and add new behavior by adding new objects.

The costs: a composed whole relies on many small objects cooperating through message-passing, so the *combination* of the parts may be less obvious than a single hierarchy. Composition excels at the "has-a" whole, but it doesn't automatically arrange for the parts to share code — that's what modules and inheritance are for.

## Choosing Relationships: A Summary of the Rules

The chapter closes with pragmatic guidance for picking a technique:

- **Use inheritance for is-a relationships.** When objects are genuinely a specialized kind of a more general thing, and the hierarchy is shallow and stable, classical inheritance pays off.
- **Use duck types (and modules) for behaves-like-a relationships.** When otherwise-unrelated objects need to play a common role, define the role as a duck type and, if there's shared code, put it in a module.
- **Use composition for has-a relationships.** When an object is made of parts, or has many of a thing, give it those parts and delegate to them. This is often the safest default.

Metz's overall bias: **favor composition** when you're unsure. It keeps objects small and flexible, and the cost of a wrong composition decision is far lower than the cost of a wrong inheritance decision. Inheritance and modules are powerful but rigid; reach for them only when the relationship genuinely warrants it.

## Key Takeaways

1. **Composition builds a whole from parts via has-a relationships and delegation** — objects *have* other objects rather than *being* them.
2. **Rebuilding the bicycle with composition** turns a rigid hierarchy into small, swappable objects: `Bicycle` has `Parts`, which is a collection of `Part`s.
3. **Use a factory** to encapsulate the knowledge of how to assemble valid composed objects from configuration data.
4. **Depend on the part's duck type**, not its class — so a `Part` can even become a simple `Struct` without breaking anything.
5. **Inheritance is for is-a, modules/duck types are for behaves-like-a, composition is for has-a.**
6. **Inheritance has a high cost when you're wrong**; composition keeps things flexible and transparent, so **favor composition** unless a true is-a relationship justifies inheritance.
