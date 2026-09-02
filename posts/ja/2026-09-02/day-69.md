---
title: "Day 69"
date: "2026-09-02"
excerpt: "Claude Code Actionでmax turn超過エラー。permission deniedが多くターンを無駄に消費していたので、一時的にshow_full_outputを有効にして不足権限を確認する。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "claude-code", "github-actions", "ci", "permissions"]
coverImage: ""
---

## 今日やったこと：

- Claude Code Actionでmax turn超過によるエラーに遭遇 — permission deniedの回数がかなり多く、無駄にターンを消費していた；どの権限が拒否されているか確認するため一時的に `show_full_output: true` を追加、明日確認して必要なら足りない権限を追加する予定（[action.yml](https://github.com/anthropics/claude-code-action/blob/main/action.yml)）

---

> 🌐 *Claudeによる翻訳*
