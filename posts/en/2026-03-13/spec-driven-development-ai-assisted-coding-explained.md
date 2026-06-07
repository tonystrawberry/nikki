---
title: "Spec-Driven Development: AI Assisted Coding Explained"
date: "2026-03-13"
excerpt: "Notes on spec-driven development — how writing specs before code reduces ambiguity and improves AI-assisted coding compared to vibe coding."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ai", "software-engineering", "spec-driven-development", "vibe-coding"]
youtubeUrl: "https://www.youtube.com/watch?v=mViFYTwWvcM"
---

## Overview

This video explains **spec-driven development** — a structured approach to AI-assisted coding that brings back software development life cycle (SDLC) principles into the age of coding agents. It contrasts this with **vibe coding**, the more common "just prompt and iterate" approach.

## Vibe Coding: The Current Default

Most people using AI coding agents follow this loop:

1. Write an initial prompt ("build me X in Python")
2. The model generates boilerplate code
3. You edit the prompt or give follow-up instructions
4. Go back and forth until you reach the desired implementation

**Problems with vibe coding:**
- The model may interpret your prompt differently each time — 100 tries could give 100 different results
- You don't control *how* the model makes architectural decisions
- It skips the traditional SDLC (planning, design, testing, deployment, maintenance)
- Debugging is harder because you don't know *why* the model chose a specific approach

**Where vibe coding shines:** quick prototypes, testing ideas, small edits on the fly.

## Spec-Driven Development: A Structured Alternative

Spec-driven development reintroduces SDLC components into AI-generated development:

### The Workflow

1. **Prompt for behavior, not implementation** — instead of "build me a login page," describe what the system should do, its constraints, and expected behavior
2. **Generate requirements** — the LLM creates a requirements specification that acts as a contract
3. **Review and approve** — if happy, convert requirements into a design document with todos for each implementation step; if not, edit the spec (nothing has been implemented yet)
4. **Implement** — once the design is approved, the AI agent writes code guided by the spec
5. **Test** — test cases can be generated directly from the spec

### Example: User Authentication

**Vibe coding approach:**
> "Hey, we need a /login page for users to authenticate"
> → Model picks one of 30 possible implementations → iterate back and forth

**Spec-driven approach:**
- **Feature:** User Authentication
- **Endpoint:** `POST /login`
- **Parameters:** `user`, `pass`
- **Failure handling:** specific error codes (e.g., missing username)
- **Test cases:** valid credentials → 200, missing fields → specific error codes

The spec removes ambiguity — the agent knows exactly what to implement and why.

## How It Relates to Other Development Approaches

| Approach | Starting Point | Flow |
|----------|---------------|------|
| Traditional | Code first | Code → Documentation |
| Test-Driven (TDD) | Tests first | Tests → Code |
| Spec-Driven (SDD) | Specs first | Specs → Design → Code → Tests |

Spec-driven development is essentially **TDD and BDD on steroids** — the specification becomes the primary artifact that drives all downstream work: implementation, tests, documentation, and verification.

## Key Takeaways

1. **Vibe coding skips the SDLC** — great for prototyping, but produces unpredictable results for real applications
2. **Specs reduce ambiguity** — AI models work better with clear instructions than vague prompts
3. **Nothing is implemented until you approve** — you review requirements and design before any code is written
4. **Specs become the contract** — they drive implementation, testing, and documentation
5. **The primary skill shift** — from writing/reviewing code to effectively conveying what you want to build
