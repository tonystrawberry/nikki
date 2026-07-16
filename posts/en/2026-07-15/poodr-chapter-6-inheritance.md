---
title: "POODR Chapter 6: Acquiring Behavior Through Inheritance"
date: "2026-07-15"
excerpt: "Classical inheritance done right — recognizing where it fits, refactoring concrete classes into an abstract superclass, and using the template method pattern with hooks instead of super."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "inheritance", "template-method", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 6
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Chapter 6 introduces **classical inheritance** — sharing behavior between classes through a superclass/subclass hierarchy. Inheritance is powerful but easy to misuse. The chapter walks through the whole arc: recognizing when inheritance is the right tool, discovering the abstraction, moving it into an abstract superclass, and finally decoupling the hierarchy so subclasses don't have to know how they cooperate with their parent.

## Understanding Classical Inheritance

Inheritance is, at its core, a mechanism for **automatic message delegation**. When an object receives a message it doesn't understand, it forwards the message up the inheritance chain. Defining a hierarchy just means arranging classes so that unhandled messages travel in a sensible direction.

"Classical" here refers to *class*-based inheritance (as opposed to prototypal or module-based). A subclass **is a** specialization of its superclass — it should be everything the superclass is, plus more.

## Recognizing Where to Use Inheritance

The chapter starts with a single `Bicycle` class that has grown to handle multiple kinds of bikes. It's riddled with a smell: attributes and behavior that apply to *some* bikes but not others, controlled by checking a `style` variable.

```ruby
class Bicycle
  attr_reader :style, :size, :tape_color, :front_shock, :rear_shock

  def spares
    if style == :road
      { chain: '10-speed', tire_size: '23', tape_color: tape_color }
    else
      { chain: '10-speed', tire_size: '2.1', rear_shock: rear_shock }
    end
  end
end
```

That `if style == ...` is the tell. **A variable holding the name of a "type" or "category," used to decide which message to send, is the classic signal that inheritance may help.** It means one class is really trying to be two.

## Misapplying Inheritance

A tempting first move is to make `MountainBike` a subclass of the existing concrete `Bicycle`. This fails, because `Bicycle` is a **concrete class that mixes general bike behavior with road-bike specifics**. `MountainBike` then inherits road-bike behavior it doesn't want (like `tape_color`) and has to work around it. Subclasses that override methods to *cancel* inherited behavior are a sign the hierarchy is wrong.

The lesson: **you cannot create a good subclass of a class that is already concrete and specific.** The superclass must be abstract.

## Finding the Abstraction

Two conditions must hold for inheritance to make sense:

1. The objects you're modeling have a genuine **is-a / general–specific** relationship.
2. You can use the correct **coding technique** to build the hierarchy.

The strategy is to **push everything down** and **pull the abstraction up**:

1. Create an empty abstract `Bicycle` superclass.
2. Make `RoadBike` and `MountainBike` inherit from it, and move *all* behavior down into the concrete subclasses first. (This is safer than trying to guess the abstraction upfront.)
3. Then **promote** the truly shared, general behavior back up into `Bicycle`, one piece at a time.

Promoting *up* is safer than demoting *down*: if you accidentally leave something concrete in the abstract class, every subclass suffers; if you promote too little, only the affected subclass breaks and it's easy to spot.

```ruby
class Bicycle
  attr_reader :size          # shared by all bikes -> promoted up

  def initialize(args = {})
    @size = args[:size]
  end
end

class RoadBike < Bicycle
  attr_reader :tape_color    # road-specific -> stays down

  def initialize(args)
    @tape_color = args[:tape_color]
    super(args)
  end
end
```

## The Template Method Pattern

The abstract superclass defines the *algorithm* and calls out to methods that subclasses fill in. This is the **template method pattern**: the superclass sends a message, and each subclass provides its own specialized version.

```ruby
class Bicycle
  def initialize(args = {})
    @size = args[:size]
    @chain = args[:chain] || default_chain
    @tire_size = args[:tire_size] || default_tire_size
  end

  def default_chain            # common default
    '10-speed'
  end
end

class RoadBike < Bicycle
  def default_tire_size        # subclass supplies the specialization
    '23'
  end
end
```

**Always provide a sensible default or explicitly raise** for any template method. If `Bicycle` calls `default_tire_size` but doesn't define it, a future subclass author who forgets to implement it gets a confusing `NameError`. Better to fail loudly with a helpful message:

```ruby
def default_tire_size
  raise NotImplementedError,
        "#{self.class} should have implemented ..."
end
```

## Managing Coupling Between Superclass and Subclass

The naive hierarchy forces every subclass's `initialize` and `spares` to call `super`. That's fragile: it couples the subclass to the *algorithm* of the superclass. If a new subclass author forgets to send `super`, the object breaks in subtle ways. This is the "**subclasses must know how to cooperate**" trap.

The fix is the **hook method pattern**. The superclass defines the full algorithm and sends *hook* messages that subclasses may optionally override. Subclasses supply specializations without ever calling `super`:

```ruby
class Bicycle
  def initialize(args = {})
    @size = args[:size]
    @chain = args[:chain] || default_chain
    @tire_size = args[:tire_size] || default_tire_size
    post_initialize(args)      # hook: subclass contributes here
  end

  def post_initialize(args)
    nil                         # default: do nothing
  end

  def spares
    { tire_size: tire_size, chain: chain }.merge(local_spares)
  end

  def local_spares             # hook for subclass-specific spares
    {}
  end
end

class RoadBike < Bicycle
  def post_initialize(args)    # no super needed
    @tape_color = args[:tape_color]
  end

  def local_spares
    { tape_color: tape_color }
  end
end
```

Now the superclass owns the *when* (the algorithm), and subclasses only own the *what* (their specialization). Subclasses no longer need to know the abstract algorithm — they just fill in the blanks. This dramatically reduces coupling and makes the hierarchy easy to extend.

## Key Takeaways

1. **Inheritance is automatic message delegation** up a class hierarchy; a subclass must be a true specialization (is-a) of its superclass.
2. **A "type" variable driving conditionals** (`if style == ...`) is the signal that inheritance might help.
3. **Never subclass a concrete class** — the superclass must be abstract, containing only behavior common to all subclasses.
4. **Build the abstraction by pushing everything down and pulling shared behavior up**; promoting up is safer than demoting down.
5. **Use the template method pattern** so the superclass defines the algorithm and subclasses supply specializations — and always provide defaults or raise `NotImplementedError`.
6. **Prefer hook methods over forcing subclasses to call `super`**, so subclasses don't have to know the superclass's algorithm and the two stay loosely coupled.
