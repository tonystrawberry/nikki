---
title: "Claude Masterclass · 7: Claude Design"
date: "2026-11-22"
excerpt: "Anthropic's design product: prototypes, slide decks, a reusable design system, templates and 3D visuals. It burns credits fast, so here are the token tips, the design-to-code handoff and an open-source alternative."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-design", "design-systems", "prototyping", "udemy"]
collection: "claude-masterclass"
collectionOrder: 7
collectionTitle: "Claude Masterclass (Udemy)"
---

## TL;DR

**Claude Design** is a separate Anthropic product, opened from the claude.ai sidebar, for generating professional designs from natural language: landing pages, social content, app prototypes, decks and 3D visuals. Its strengths are **consistency through a design system** and fast iteration. Its weakness is a **separate weekly usage limit** that drains quickly.

## Creating a project

Start a project and choose a type: **Prototype** (the one you'll use most), **Slide deck**, **From template** or **Other**. Prototypes come in two fidelities:
- **Wireframe** for quick structure.
- **High fidelity** for production-ready work.

The layout is chat on the left and a live preview on the right. You can attach files, and **Sketch** lets you draw the layout you want.

## Design system: set it up first

A design system is your brand's rules: logo, fonts, colours, buttons, layout and components. Build it once and select it in every new project, so every deck and page looks the same and you stop re-explaining your style. You can export it as a ZIP from **Share**.

The demo brand was a fictional wearable called "Knight Firm". The same system produced a **slide deck** (materials, battery, water resistance, price) and a **landing page** with an order button.

## Templates

- **Share → Duplicate as template** publishes it for your org; then **New from this template**.
- The **Examples** tab has ready-made templates.

## Use cases from the course

- Recreate a plain Google Doc as a polished **PDF**.
- Turn a site's HTML into a **promo video** or an **animated chart** (have Claude write a detailed prompt first, because detailed prompts work much better).
- Build an **interactive 3D** solar system with orbits, hover labels and a time-scale control. That was the section challenge.
- Final project: a **full website built from scratch and deployed to Vercel**.
- **Mobile app prototype**: design it in Claude Design, export the ZIP, then let **Claude Code** in VS Code wire up every button and tab. Designer, then developer.

## Tokens, limits and tips

- Check **Settings → Usage**. Claude Design has its **own weekly limit**, and Pro gets much less than Max. A single complex app can use 40–50% of it.
- **Don't brainstorm in Claude Design.** Think it through in normal chat, then come in with a precise prompt.
- **Put the instruction last**, after all the context.
- Use the ⚙️ icon to pick the model per project: Haiku 4.5, Sonnet 4.6 or Opus 4.7.
- You can run **several projects in parallel** in different tabs.

## Free alternative: Open Design

**Open Design** is an open-source, local clone with 40k+ stars, dozens of skills and design systems, and web, mobile, slide, image and video prototypes. You install it with one prompt in Claude Code and **bring your own API key** (OpenAI, etc.), so the only limit is your own model usage.
