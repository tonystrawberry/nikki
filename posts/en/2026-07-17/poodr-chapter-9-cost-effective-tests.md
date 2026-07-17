---
title: "POODR Chapter 9: Designing Cost-Effective Tests"
date: "2026-07-17"
excerpt: "Writing tests that pay for themselves — what to test, when to test, how to test incoming and outgoing messages, and keeping the test suite cheap to maintain as the design evolves."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "testing", "tdd", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 9
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Overview

Chapter 9 closes the book by treating tests as a design problem of their own. Tests are not free — they cost time to write, read, and change. A good suite **proves** that your application works *and* that your design is sound, while staying cheap to maintain when the code evolves. The goal is **cost-effective tests**: maximum confidence for minimum ongoing cost.

## Intention of Tests

Tests serve several overlapping purposes:

- **Finding bugs** — catch regressions before users do.
- **Documenting design** — a well-written test is an executable example of how an object is meant to be used.
- **Deferring design decisions** — with a safety net, you can refactor toward a better design without fear.
- **Supporting change** — the suite exists so you can change the app; if changing a test is harder than changing the code, the suite has become a liability.

> The point of tests is not to write the most tests — it is to write the *right* tests.

## Knowing What to Test

Test the **public interface** of each object. Incoming messages that make up the object's contract are the ones that matter. Avoid testing:

- **Private methods** — they are implementation details. Testing them couples the suite to *how* the object works, so every internal refactor breaks tests that still prove nothing extra about the public contract.
- **Incoming messages that don't change state and don't return anything useful** — usually not worth asserting.
- **The same behavior twice** across layers of the hierarchy or across overlapping roles — put the assertion where the behavior is defined, once.

A useful rule of thumb: **test everything that could break, but only once, and only through the public interface.**

## Knowing When to Test

Write tests as close as possible to when you write the code — ideally first (TDD) or immediately after. Tests written long after the fact are harder to get right (you no longer remember the intended interface) and tend to lock in accidental design.

Also: **write tests for the code you are about to change.** An untested area you need to touch is a place where the suite should grow first, so the change can be verified.

## Knowing How to Test

### Incoming Messages

For every public method that returns a value (a **query**), assert the return value. For every public method that changes state (a **command**), assert the resulting state.

```ruby
# Incoming query — assert the result
assert_equal 4.727, gear.gear_inches

# Incoming command — assert the side effect / resulting state
bicycle.shift
assert_equal :high, bicycle.gear
```

These tests prove that the object keeps its contract with its *senders*.

### Outgoing Messages

Outgoing messages fall into two categories:

1. **Queries sent to others** (you ask for a value and use it) — do **not** assert that the message was sent. The return value is already exercised through the incoming-message test. Asserting the send couples you to a collaborator's private details.
2. **Commands sent to others** (you tell another object to do something, and the side effect matters) — **do** assert that the message was sent, typically with a mock. If the command never fires, the rest of the world is wrong even if this object looks fine in isolation.

```ruby
# Outgoing command — prove the message is sent
mock_wheel = MiniTest::Mock.new
mock_wheel.expect(:rotate, true)
gear = Gear.new(chainring: 52, cog: 11, wheel: mock_wheel)
gear.rotate_wheel
mock_wheel.verify
```

### Testing Duck Types

When several classes play a role (a duck type), write a **shared test** for that role and include it in each player's test. That way the role's interface is documented once, and every player is proven to honor it.

### Testing Inherited Code

- Test the **abstract superclass** through a concrete subclass created only for the test (or through every real subclass).
- In each subclass, test only the **specializations** — the hooks and overrides that differ from the inherited defaults. Don't re-test inherited behavior that the superclass suite already covers.

## Using Test Doubles Wisely

**Stubs** return canned values so you can isolate the object under test. **Mocks** both stub and assert that a specific message was sent (with specific args). Overusing mocks creates brittle tests that break whenever a collaborator's interface shifts — even when behavior is still correct.

Prefer:

- Testing against **real, simple collaborators** when they're cheap and stable.
- Mocks only for **outgoing commands** whose side effects you must verify.
- Role tests (shared examples) so every duck-type player is checked the same way.

## Keeping Tests Cheap to Change

The same design rules from earlier chapters apply to the suite:

- **Depend on interfaces, not implementations** — assert results and public contracts, not private method calls or internal data structures.
- **Avoid duplication** — shared role tests, factories/fixtures for object setup.
- **Make the intention obvious** — a failing test should point clearly at the broken contract.

A suite that mirrors a well-designed application stays small, clear, and easy to update. A suite that reaches into private details becomes another tangled dependency graph.

## Key Takeaways

1. **Tests are an investment** — optimize for confidence per unit of maintenance cost, not for coverage percentage alone.
2. **Test the public interface** — incoming queries (assert results) and incoming commands (assert resulting state).
3. **Don't test private methods**; don't re-test inherited or shared behavior in every subclass/player.
4. **Outgoing queries need no "was it sent?" assertion**; **outgoing commands do** (use mocks).
5. **Document duck-type roles with shared tests** that every player includes.
6. **Write tests close to the code** (TDD or immediately after), especially before changing untested areas.
7. **A good suite supports change** — if the tests are harder to change than the code, redesign the tests.

---

*This is the final chapter of Practical Object-Oriented Design in Ruby. The book as a whole is a practical guide to arranging objects so that change stays cheap — and chapter 9 extends that same discipline to the tests that protect the design.*
