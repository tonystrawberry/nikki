---
title: "Claude マスタークラス · 10：Claude と他のツール"
date: "2026-11-22"
excerpt: "Claude を Excalidraw、Higgsfield、Canva、NotebookLM、ElevenLabs、Firecrawl、Notion、Google Stitch につなぐ。主に Claude Code がセットアップする MCP サーバー、コネクタ、Skills を使う。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "mcp", "integrations", "udemy"]
collection: "claude-masterclass"
collectionOrder: 10
collectionTitle: "Claude マスタークラス (Udemy)"
---

## TL;DR

ほとんどの連携は次の3パターンのどれかに当てはまる：
1. **組み込みコネクタ**をオンにする（Canva、Notion）。
2. **Claude Code** にリポジトリを渡して「README を読んで、ローカルにインストールして実行して」と頼む。これでローカルの MCP サーバーや CLI がセットアップされる。
3. 他のツールへのうまいプロンプトの書き方を Claude に教える **Skill** を追加する。

```text
<repo URL> を開いて <tool> をセットアップしてください。まず README を読み、
ローカルでインストールを一通り行ってください：clone、依存関係のインストール、ビルド、実行、
そして Claude への接続まで。
```

## 連携一覧

| ツール | できること | 方法 |
|---|---|---|
| **Excalidraw** | 説明文、構造化テキスト、スクリーンショットから複雑な図を数秒で作成 | Claude Code がローカルにインストールするオープンソースの Excalidraw MCP。公式コネクタより多くのことができる |
| **Higgsfield** | 画像と動画（GPT Image、Nano Banana、Seedance、Veo 3.1） | 接続してから講座の**プロンプト作成スキル**を追加：Claude がプロンプトと設定を書き、Higgsfield が生成する |
| **Canva** | ブランドカラーでの SNS 投稿、ロゴ、サムネイル、インフォグラフィック | Customize → Connectors → Canva |
| **NotebookLM** | ソース、スライド資料、マインドマップ、動画を自動生成 | Claude Code でコミュニティリポジトリの Skill とスクリプトを使う。Settings → Claude Code で *bypass permissions* を許可し、Google にサインインする必要がある場合も |
| **ElevenLabs** | FAQ で学習させた**音声サポートエージェント**をサイトに埋め込む | Claude Code で構築：システムプロンプト + ナレッジベース + ツール（カスタム MCP も可） |
| **Firecrawl** | 本格的なスクレイピング：scrape、map、複数ページのクロールで Markdown 化、ブラウザ自動化 | Claude Code が CLI をインストールして認証する。約29個の Skills が追加される。組み込みの Web 検索は軽い調べものにしか向かない |
| **Notion** | ページやデータベースを作成し、Web 調査の結果で埋める | Notion コネクタ。Notion 自身のエージェントと違い、Claude のプランに含まれ、Notion AI の追加上限はない |
| **Google Stitch 2.0** | AI による UI デザイン → 高忠実度の画面 + HTML/CSS、Figma エクスポート、既存サイトのリデザイン | **Stitch MCP サーバー**を追加して Claude Code から Stitch を操作する |

## まとめ

- **組み込みツールは軽い用途向け**（Web 検索、公式コネクタ）。重い作業や専門的な作業には、専用ツールと MCP サーバーまたは Skill の組み合わせのほうがずっと良い。
- **Claude Code がインストーラーになる**：リポジトリ URL を添えたプロンプト1つで手作業のセットアップが不要になる。
- **Skills が専門知識を運ぶ**：優れた画像・動画プロンプトの書き方などを持たせておけば、連携の品質が毎回保たれる。

---

> 🌐 *Claudeによる翻訳*
