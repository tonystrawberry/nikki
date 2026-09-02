---
title: "Day 69"
date: "2026-09-02"
excerpt: "Hit Claude Code Action max-turn errors, noticed many wasted turns on permission denied, and temporarily enabled show_full_output to audit missing permissions."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "claude-code", "github-actions", "ci", "permissions"]
coverImage: ""
---

## Today, I:

- encountered Claude Code Action errors due to max turns being exceeded — noticed the permission-denied count was quite high and was consuming turns for nothing; temporarily added `show_full_output: true` to see which permissions are denied, will check tomorrow and add the missing ones if needed ([action.yml](https://github.com/anthropics/claude-code-action/blob/main/action.yml))
