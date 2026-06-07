---
title: "開発者が git worktree を避けられなくなった理由"
date: "2026-03-19"
excerpt: "git worktree の重要性：1リポジトリで複数のワーキングディレクトリ、コンテキスト切り替え、ホットフィックス、PRレビュー、そしてAIエージェントを別worktreeで動かす。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["git", "worktree", "workflow", "ai", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=S8_AsOuAwLo"
---

## 概要

**git worktree** はもはや開発者にとってオプションではないという主張の動画。話者は Chiao Tran のワークフローに触発されたが、worktree は難しそうで使う場面を避けてきた。ところが **AIエージェント** の登場で、その状況が一変した。

## worktree が解決する問題

- **コンテキスト切り替え** を stash や WIP コミットなしに：例）機能開発中にホットフィックス、PRレビュー、同じリポジトリの別ブランチへ切り替えが必要なとき。
- **AIエージェントワークフロー：** AIエージェントが15〜30分以上同じリポジトリで作業（例：マルチフェーズのタスクで完了時にPR作成）している間、同じワーキングディレクトリでは作業できない — エージェントが同じファイルを編集する。worktree がないと：PR ができるまで待つ（例：YouTube を見る）か、コンフリクトを覚悟するかになる。

## git worktree とは

- **worktree** は、同じ Git リポジトリに紐づいた別ワーキングディレクトリで、通常は別ブランチをチェックアウトしている。
- **複数 worktree** が可能：例）main を `./my-project`、feature を `./my-project-feature`、agent を `./my-project-agent`。それぞれディスク上のファイルは別。両方完了したら従来どおりマージ。
- **作成：** `git worktree add <path> [branch]`（例：`git worktree add ../my-project-hotfix main`）。**lazygit** なども worktree の作成・管理に対応。

## 今や避けにくくなった理由

- **AIエージェント** は長時間動作し、コードベースを変更する。エージェント実行中に同じリポジトリで別の作業を続けたいなら、2つ目のワーキングディレクトリが必要 — それが worktree。同じリポジトリ、同じ履歴、別のワーキングツリー、通常は別ブランチ。

## 要点

- git worktree = 1リポジトリから複数のワーキングディレクトリ（ブランチは違っても .git 履歴は共有）。
- 用途：ホットフィックス、PRレビュー、**AIエージェントを別 worktree で動かして**、別の作業は継続する。
- `git worktree add` または lazygit で作成。完了後にブランチをマージ。

---
> 🌐 *Claudeによる翻訳*
