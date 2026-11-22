---
title: "Claude マスタークラス · 3：Claude Skills 応用編"
date: "2026-11-22"
excerpt: "スキルをきちんと設計する。プロジェクトや自動化ツールより優れている理由、description と指示の書き方、3 つのテスト、フォルダ構成、そして Claude Code での手作り。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-skills", "claude-code", "prompting", "udemy"]
collection: "claude-masterclass"
collectionOrder: 3
collectionTitle: "Claude マスタークラス (Udemy)"
---

## TL;DR

セクション 2 は Skill Creator の使い方だった。このセクションはスキルを自分で**設計する**話だ。良いフロントマター、明確な指示、整理されたフォルダ構成、そして実際のテスト。内容は Anthropic の 33 ページのスキルガイドがベースになっている。

## なぜスキルなのか？

- **Projects やカスタム GPT** は 1 つのコンテキスト、1 つのプロジェクトに縛られる。
- **n8n や Make** の自動化は決定的で、ハードコードされている。
- **スキル**は柔軟で、エージェントは**何千個**も読み込める。しかもそれぞれ必要なときだけ読み込まれる。さらに**自己改善**もできる。承認したアウトプットは良い例として保存されていく。

## フロントマターがスキルの発動タイミングを決める

Claude が常にメモリに保持するのは `name` と `description` だけ。つまりこの 2 つがスキルの第一印象になる。

```yaml
---
name: csv-data-pipeline          # ケバブケース
description: Cleans, validates and transforms CSV files. Use when the
  user uploads a .csv or asks to clean, dedupe or reformat tabular data.
---
```

- ❌ `Helps with projects.` は何にでもマッチしてしまう。
- ✅ **何をするか**と**いつ使うか**を、トリガーワードやファイル形式と一緒に書く：「Figma ファイルを分析し、開発者向けハンドオフドキュメントを生成する。ユーザーが .fig をアップロードしたとき、またはデザイン仕様を求めたときに使う。」

指示は曖昧なアドバイスではなく、明示的なルールと出力フォーマットを含む具体的な手順にする。

## 3 つの方法でテストする

| テスト | 問い | 方法 |
|---|---|---|
| トリガー | 発動すべきときに発動するか？ | **新しいセッション**で、発動すべきプロンプトとすべきでないプロンプトを試す |
| 機能 | アウトプットは正しく一貫しているか？ | 少しずつ違う入力で 4〜5 回実行する |
| 価値 | スキルにする価値はあるか？ | 複雑さとメリットを比べる。何でもスキルにする必要はない |

**発動しなさすぎる**ならトリガーワードを足す。**発動しすぎる**なら description を絞り込む。

## フォルダ構成

```text
❌ my-skill/
   └── SKILL.md            # すべてを 1 ファイルに詰め込んでいる

✅ csv-data-pipeline/
   ├── SKILL.md            # 常に最初に読み込まれる
   ├── references/
   │   └── column-types.md # 必要に応じて読み込まれる
   └── scripts/
       └── clean.py        # 必要なときだけ実行される
```

ファイルを分けると `SKILL.md` が焦点を保てるうえ、リファレンスは Claude が必要なときだけ読むので**コンテキストの節約**になる。

## Claude Code で手作りする

デモでは VS Code で、Skill Creator を使わずに**メール下書きライター**を作る：

```text
.claude/
└── skills/
    └── email-draft-writer/
        ├── SKILL.md
        └── references/
            ├── examples.md
            └── tone-guidelines.md
```

- `.claude` の先頭のドットに注意。
- このスキルは指示だけなので `scripts/` はない。
- 編集するときは `SKILL.md` を直接開けばいい。ただの Markdown だ。最もよくある修正は description へのトリガーワード追加。
- トーンやテンプレートを追加するときは、新しいリファレンスファイルを作って **SKILL.md からリンクする**。

## 演習

日々の実際の悩みを解決するスキルを作る。例えば、議事録→アクションアイテム付きサマリー、生の数字→週次レポートなど。デザインパターンを選び、少なくとも 1 つのリファレンスを含む `SKILL.md` + `references/` を作り、そして**壊してみる**。

---

> 🌐 *Claudeによる翻訳*
