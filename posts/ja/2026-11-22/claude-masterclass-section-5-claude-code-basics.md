---
title: "Claude マスタークラス · 5：Claude Code の基本"
date: "2026-11-22"
excerpt: "Claude Code のインストール、毎日使うコマンドとモード、Plan モードで作る最初のアプリ、Claude にコミットとプッシュを任せる方法、そしてプロジェクトの記憶としての CLAUDE.md。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "claude-code", "git", "github", "vscode", "udemy"]
collection: "claude-masterclass"
collectionOrder: 5
collectionTitle: "Claude マスタークラス (Udemy)"
---

## TL;DR

Claude Code は**ターミナルの中で動く**エージェント型アシスタントだ。実際のファイルを読んで編集し、コマンドを実行し、会話からフィーチャーを作り上げる。Pro 以上のプランが必要。このセクションでは、インストール、基本コマンド、Plan モードで作る最初のアプリ、Claude 経由の git と GitHub、そしてプロジェクトのルールをセッションをまたいで残すための **CLAUDE.md** を扱う。

## インストールと初回起動

```bash
curl -fsSL https://claude.ai/install.sh | bash   # macOS / Linux
irm https://claude.ai/install.ps1 | iex          # Windows PowerShell

cd ~/Desktop/"Claude Code Test"   # 必ずプロジェクトフォルダの中で始める
claude                            # フォルダを信頼する
claude update                     # バージョンが古いと言われたら
```

セッション内で `/login` を実行し、**サブスクリプション**（おすすめ：月額固定、利用上限は数時間ごとにリセット、Claude Code on the web も含まれる）と **Console API キー**（トークン従量課金で、すぐにかさむ）のどちらかを選ぶ。

素のターミナル、**デスクトップアプリ**（Code タブ、最もとっつきやすい）、または VS Code、Cursor、Antigravity などの IDE で使える。IDE では `` Ctrl/Cmd+` `` で統合ターミナルを開いて `claude` を実行するか、Anthropic 製の **Claude Code 拡張機能**（認証済みチェックマークを確認）をインストールする。Antigravity ではデフォルトの Gemini エージェントパネルを閉じ、代わりに拡張機能を使う。

## 毎日使うコマンド

```text
/terminal-setup   Shift+Enter = 送信ではなく改行
/context          200k のウィンドウを何が占めているか（system、tools、MCP、skills、messages）
/clear            新しい会話
/exit · /resume   終了、その後過去の会話を再開
/model            Opus（最高性能）、Sonnet（トークン節約）、Haiku、加えて effort レベル
/config           例：thinking モードのオン／オフ（オフは速いが質が落ちる）
/theme · /statusline
```

**Shift+Tab** でモードを切り替える：
- **Default** はすべての編集やコマンドの前に確認を求める。
- **Accept edits** はファイルを自由に編集するが、危険な操作の前には確認する。
- **Plan モード**はコードに一切触れない。作業内容を相談し、実装計画を受け取る。

コンテキストウィンドウが満杯に近づくと、Claude Code は**自動コンパクト**（履歴を要約）し、細かい情報が失われる。タスクは小さく保ち、こまめに `/clear` すること。

## 最初のアプリ：習慣トラッカー

Plan モードでアプリを説明する：毎日の習慣、完了マーク、連続記録、ダッシュボード。Claude はスタック（React + Vite を推奨）とストレージ（localStorage）について**確認の質問**をしてくる。その後計画を書くので、*auto-accept edits* を選ぶと、雛形作成、インストール、型チェック、開発サーバー起動まで進む。合計で約 7 分、15k トークン。あとは次のコマンドで起動する：

```bash
npm run dev
```

## より良い結果を得るには

- 入力が悪ければ出力も悪い。Claude は、きちんとしたブリーフが必要な優秀な新入社員として扱う。
- **プロダクトではなくフィーチャーで考える**：「予約アプリ」ではなく「カレンダー表示、メール確認、クライアントログイン、決済付きの予約アプリ」。そのリストが PRD になる。
- 次に進む前に**各フィーチャーをテストする**：「先に進む前に、このフィーチャーが動くことを確かめる簡単なテストを書いて。」

## Git と GitHub は Claude にお任せ

Git は道具（ローカルのスナップショット、無制限の取り消し）、GitHub は保管場所（共同作業もできるオンラインバックアップ）。セットアップは一度だけ：

```bash
git --version
brew install gh        # または cli.github.com のインストーラー
gh auth login          # GitHub.com → HTTPS → Y → ブラウザでログイン
```

その後：

```text
このプロジェクト用の GitHub リポジトリを作成し、今後はすべての変更を
わかりやすいメッセージでコミットして、定期的にプッシュしてください。
```

Claude は `.gitignore` と README を書き、初回コミットをして、リポジトリを作成しプッシュする。GitHub 上では Claude が共同作成者としてクレジットされる。

## CLAUDE.md はプロジェクトの記憶

新しいセッションは**何も覚えていない**。Claude は git log を読めるが、自分が決めたルールまではわからない。解決策が `CLAUDE.md` で、毎セッションの開始時に自動で読み込まれる。

```text
/init     # リポジトリをスキャン → CLAUDE.md の下書きを作成（概要、アーキテクチャ、実行方法）
```

そこに自分のルールを追加する：

```markdown
## Git ワークフロー
意味のある変更のたびに、簡潔なメッセージでコミットし GitHub に push すること。
何かを変更する前に、必ずこれから何をするか説明すること。
ファイルを削除する前に必ず確認すること。
```

プロジェクトの最初に `/init` を実行し、Claude に覚えておいてほしいことがあるたびにこのファイルを更新する。これを習慣にしよう。

---

> 🌐 *Claudeによる翻訳*
