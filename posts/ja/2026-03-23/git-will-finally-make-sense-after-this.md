---
title: "Git がついに腑に落ちる"
date: "2026-03-23"
excerpt: "Git の基礎をゼロから解説する動画：コミット=スナップショット、DAG構造、ブランチ=ポインタ、HEAD、detached HEAD、3つの領域（working/staging/repo）、取り消し系コマンド。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["git", "version-control", "video", "fundamentals"]
youtubeUrl: "https://www.youtube.com/watch?v=Ala6PHlYjmw"
---

## 概要

Git をゼロから分解して理解する動画。多くの開発者はコマンドを暗記しているだけで内部モデルを理解していない。ここでは「なぜそう動くか」を整理し、Git への苦手意識を減らすことが目的。

## Git はデータベース

- **Git はデータベース**で、基本単位は**コミット**。
- コミットは、その時点のプロジェクト全体の**スナップショット**。
- 「差分だけ」ではなく、その瞬間の全ファイル状態を保持する。

## コミットに含まれるもの

1. スナップショットへのポインタ
2. メタデータ（作成者、時刻、メッセージ）
3. 親コミットへのポインタ

コミットは過去へ向かってつながる。最初のコミットは親を持たない。マージコミットは通常2つの親を持つ。

## DAG（有向非巡回グラフ）

Git の履歴は **DAG**。

- **有向**：リンク方向は子 -> 親
- **非巡回**：ループしない
- **グラフ**：ノード（コミット）とエッジ（関係）

各コミットが完全なスナップショットなので、任意の時点に直接戻れる。

## ブランチはポインタ

- ブランチはコードのコピーではなく、コミット hash へのポインタ。
- `git branch feature` はそのポインタ（ラベル）を作るだけ。
- ブランチ上で commit すると、新しい commit が作られ、ブランチポインタが前進する。
- `main` も特別な仕組みではなく、運用上の約束。

## HEAD

- `HEAD` は現在地を示すポインタ。
- 通常は `HEAD -> branch -> commit`。
- 生の commit hash を checkout すると `HEAD` が commit 直指しになり、**detached HEAD** になる。
- detached HEAD で作った commit は、参照するブランチがなければ孤立し、最終的に GC される。

## Git の3つの領域

1. **Working directory**（作業中ファイル）
2. **Staging area / index**（次コミットの準備）
3. **Repository**（永続履歴）

流れ：編集 -> `git add` -> `git commit`。

## 取り消し系コマンド

- **checkout**：HEAD を移動
- **reset**：ブランチ先頭を移動（`--soft/--mixed/--hard` で作用範囲が変わる）
- **revert**：打ち消しコミットを新規作成（共有履歴に安全）

## 要点

- Git はスナップショット型の履歴DB
- ブランチはポインタでありコピーではない
- HEAD は現在地
- detached HEAD では孤立コミットに注意
- このモデルを理解すると checkout/reset/revert/merge/rebase が分かりやすくなる

---
*Claudeによる翻訳*
