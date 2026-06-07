---
title: "Spec-Driven Development with Kiro: Features and Capabilities"
date: "2026-04-14"
excerpt: "Notes from my first AWS Skill Builder course, summarizing Kiro's spec-driven workflow, core feature set, and practical use cases."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "skillbuilder", "kiro", "spec-driven-development", "ai", "engineering"]
---

## Overview

I completed my first AWS Skill Builder course, **Spec-Driven Development with Kiro**, and this note captures the core capabilities that stood out.

The central idea is simple: instead of starting from ad-hoc prompts, Kiro encourages a structured flow where you define intent, constraints, and expected outcomes up front, then iterate with AI while keeping the spec as the source of truth.

## What "Spec-Driven" Means in Practice

Spec-driven development with Kiro emphasizes:

- writing clear requirements before implementation
- making acceptance criteria explicit
- using the spec as the shared context between developer and AI
- validating implementation against the original contract

This reduces drift between "what we asked for" and "what we shipped."

## The Core Files Kiro Generates

One of the most practical parts of Kiro is the spec artifact set it encourages. In a typical flow, you end up with three core files:

- `requirements.md`
- `design.md`
- `tasks.md`

These files turn abstract prompts into an execution plan you can review, validate, and iterate on.

## `requirements.md` (What and Why)

`requirements.md` captures the problem definition and expected outcomes before implementation starts.

Typical contents:

- business or product goal
- scope and non-scope
- functional requirements
- constraints (technical, security, performance, compliance)
- acceptance criteria / definition of done

Why it matters:

- aligns humans and AI on the same target
- reduces ambiguous implementation decisions
- gives a stable contract to validate against later

Think of `requirements.md` as the source-of-truth promise: *what must be true when we are done*.

## `design.md` (How)

`design.md` translates requirements into an implementation strategy.

Typical contents:

- architecture and component boundaries
- data model and API/interface decisions
- sequence/flow of key operations
- trade-offs and alternatives considered
- risk areas and mitigation ideas

Why it matters:

- forces explicit reasoning before coding
- makes trade-offs reviewable by teammates
- prevents jumping from vague requirements directly into code

If `requirements.md` defines the destination, `design.md` defines the route.

## `tasks.md` (Execution Plan)

`tasks.md` breaks design into concrete, trackable work items.

Typical contents:

- ordered implementation steps
- dependencies between tasks
- validation/test tasks
- rollout or cleanup tasks

Why it matters:

- creates a deterministic path from plan to delivery
- makes parallel work easier in teams
- prevents missing critical steps (tests, migration, docs, rollback)

`tasks.md` is where strategy becomes execution.

## How These Files Work Together

A useful mental model:

1. `requirements.md` -> define intent and success criteria
2. `design.md` -> choose implementation approach that satisfies requirements
3. `tasks.md` -> execute in small, verifiable steps

Then close the loop by validating output back against `requirements.md`.

This structure is what makes Kiro's spec-driven workflow practical: each file has a distinct purpose, and together they reduce rework and hidden assumptions.

## Kiro Features I Found Most Useful

## 1) Structured Requirement Framing

Kiro helps break a task into:

- objective
- scope
- constraints
- expected outputs

That framing improves prompt quality and reduces ambiguous AI responses.

## 2) Iterative Spec Refinement

Rather than one-shot generation, the workflow encourages refining the spec over multiple passes:

- tighten unclear requirements
- add missing edge cases
- clarify non-goals

Each refinement makes downstream implementation more reliable.

## 3) Traceability from Spec to Output

A major benefit is keeping a clear line between:

- requirement statements
- generated implementation
- validation feedback

This makes review and handoff much easier, especially for team settings.

## 4) Better Validation Mindset

The course reinforces validating behavior, not just generated code volume:

- verify against acceptance criteria
- test edge cases explicitly
- treat AI output as draft until proven correct

## Capabilities to Apply in Daily Engineering Work

- use Kiro-style spec templates for feature tickets
- include constraints and non-goals in every AI coding request
- define "done" criteria before asking AI to implement
- run quick review loops that map each change back to the spec

## Key Takeaways

- spec quality strongly determines AI output quality
- explicit constraints improve correctness and reduce rework
- iterative refinement beats one-shot prompting for non-trivial tasks
- Kiro's approach is useful not only for AI tools, but for clearer engineering communication overall
- the `requirements.md` -> `design.md` -> `tasks.md` chain creates a practical bridge from idea to shippable implementation
