---
title: "Claude マスタークラス · 6：Claude Code 応用編"
date: "2026-11-22"
excerpt: "まず Plan mode、メインのコンテキストを汚さないためのサブエージェント、Claude Code での Skills、Vercel へのデプロイ、そして総仕上げの課題：n8n の AI アシスタントと予約機能つきカフェサイト。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "subagents", "vercel", "n8n", "udemy"]
collection: "claude-masterclass"
collectionOrder: 6
collectionTitle: "Claude マスタークラス (Udemy)"
---

## TL;DR

作る前に計画する。**サブエージェント**に任せてメインの会話をきれいに保つ。繰り返し使うノウハウは **Skills** にする。GitHub に push し、リポジトリを **Vercel** にインポートして公開する。

*注：Plan mode、Skills、総仕上げ課題の動画は Udemy の字幕が壊れているため、その部分は演習シートをもとにしている。*

## Plan mode を正しく使う

デモでは**家計管理アプリ**を作る（後で予算上限機能を追加）。流れは、アプリを説明 → **Claude の確認質問に答える** → 計画をレビュー → そこで初めて実装。計画ファイルは残して再利用する。「10分の計画が何時間も節約する」。

## サブエージェント

メインエージェントは**マネージャー**。サブエージェントは**それぞれ独自のコンテキストウィンドウ**で重い作業をこなし、**短い要約**だけを返す。約7万トークンの代わりに数百トークンで済む。

組み込みエージェント：

| エージェント | 役割 |
|---|---|
| `general-purpose` | 全ツール使用可、広範な複数ステップの検索 |
| `Explore` | ファイル探索とコードベースに関する質問への回答（読み取り専用） |
| `Plan` | 設計担当：実装計画、重要ファイルの特定（読み取り専用） |
| `statusline-setup` | ステータスバーを設定 |
| `claude-code-guide` | Claude Code と API に関する質問に回答（Web 検索） |

```text
@claude-code-guide Skills とは何か説明してくれる？      # 特定のエージェントに話しかける

2つの Explore エージェントを使って、このプロジェクトの
技術スタックと主な機能を要約してください。              # メインエージェントに委任させる

Ctrl+B        → 実行中のエージェントをバックグラウンドへ
Ctrl+B, ↓     → バックグラウンドタスクのパネル
```

デモでの計測：メインエージェント単独ではコンテキストの **15%** を使い、2つの Explore エージェントを並列に使うと **10%** で、しかも結果は**より良かった**。それぞれの指示が絞られていたからだ。サブエージェントは合計のトークン数を減らすわけではない。メインスレッドが埋まって圧縮されるのを**防ぐ**ためのものだ。

### カスタムエージェント

`/agents` → Create → **Project** スコープ（`.claude/agents/`）または User スコープ → *Generate with Claude* → ツール、モデル（定型レビューなら Sonnet が安い）、色、メモリを選ぶ。

```markdown
---
name: design-reviewer
description: Senior UI/UX reviewer. Use to check and improve layout, spacing,
  colours, typography, usability and responsiveness.
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---
Review the app visually and for UX. If something can be improved, fix it.
```

```text
design-reviewer エージェントを使ってデザインをチェックし、改善してください。
自分では何も変更せず、レビュアーに任せてください。
```

## Claude Code での Skills

Skills は `.claude/skills/<name>/SKILL.md` に置かれ、説明文がタスクに合致したときに読み込まれる。**skills.sh**、Anthropic の skills リポジトリ、プラグインディレクトリで見つけられる。おすすめは、プロっぽい UI を作れる **frontend-design**。便利な技として、まず **find-skills** を入れ、必要なものを Claude に探してインストールさせる方法がある。

## Vercel へのデプロイ

作るのは自分のため、デプロイはみんなのため。

```text
保留中の変更をすべて分かりやすいメッセージでコミットし、GitHub に push してください。
# まだリポジトリでない場合 →
両方やってください：git を初期化し、新しい公開 GitHub リポジトリを作成してください。
```

次に vercel.com で GitHub でサインインし、**Add New Project** でリポジトリをインポートして **Deploy** をクリック。フレームワークは自動検出され、1分もかからない。カスタムドメインは *Domains* で追加できる。**push のたびに再デプロイされる**ので、ローカルでコミットしてまとめて push する（講師によると無料枠は再デプロイ回数に制限がある）。Netlify も同じ仕組み。

## 総仕上げ：カフェサイトと n8n アシスタント

1. 計画 → 実装 → テスト。Skills（frontend-design）を入れ、**自分の Skill** を書き、**サブエージェントを2つ**追加する：デザイン担当と、コンテンツまたはコードレビュー担当。
2. **n8n** をセルフホストする（講座では Hostinger の VPS）。**本物のナレッジベースを持つチャットボット**と、送信内容が Webhook 経由で n8n に届く**予約フォーム**を作る。
3. サブエージェントでレビューし、push してデプロイ。**Webhook 認証**を有効にし、**環境変数を Vercel に設定**する。

---

> 🌐 *Claudeによる翻訳*
