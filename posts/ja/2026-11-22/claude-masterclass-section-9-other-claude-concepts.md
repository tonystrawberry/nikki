---
title: "Claude マスタークラス · 9：Office での Claude とその他の機能"
date: "2026-11-22"
excerpt: "PowerPoint と Excel の中の Claude（Skills つき）、拡張機能のための Chrome タブグループ、ChatGPT からのメモリ移行、そしてあまり使われていない機能いくつか。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "excel", "powerpoint", "chrome", "udemy"]
collection: "claude-masterclass"
collectionOrder: 9
collectionTitle: "Claude マスタークラス (Udemy)"
---

## TL;DR

Claude はいまや **Office の中**で使える（講座の収録時点ではどちらのアドインもベータ版）。Chrome 拡張は作業を**タブグループ**で整理する。**ChatGPT のメモリ**も数分で移行できる。

## PowerPoint での Claude

- claude.com → *Meet Claude* → **Claude for PowerPoint**（Microsoft Store）からインストールし、**Add-ins → Claude** を開いてサインインする。
- 資料をまるごと作る、既存のテーマとフォントに合わせてスライドを追加する、**選択した図形だけ**を編集する（複数選択は Shift を押しながら）、といったことができる。
- サイドパネルには Skills、コネクタ、Web 検索、「編集前に確認する」モードがある。自分の作ったビジュアルを自らチェックし、たとえば余白を直す。

## Excel での Claude

- 同じ方法でインストールするか、Add-ins → *Get add-ins* →「Claude by Anthropic」から入れる。
- 講座での使用例：壊れたシートのデバッグ、財務モデリング（「年次サマリーを追加し、5年目のバルーンペイメントを強調して」）、**PDF の年次報告書から財務諸表を抽出**、ダッシュボードやグラフの作成。
- ベータ版なので、挙動がおかしければサインアウトして入り直すか再インストールする。大きな変更の前にはファイルを保存しておく。

## Office での Skills

**+** をクリックすると、Cowork の Skills や組み込みの Skills が使える：`/deck-refresh` は資料を新しい数値で更新し、投資銀行向けの資料 QA スキルもある。*Manage skills* から自分の Skill も追加できる。たとえば「どの PowerPoint にも自社のビジュアルアイデンティティを適用する」など。

## Chrome のタブグループと拡張機能

Claude in Chrome で新しいチャットを始めるたびに専用の**タブグループ**が作られ、Claude はそのグループ内のタブだけを操作する。グループはプロジェクトフォルダのように扱える：折りたたむ、閉じる、ワンクリックでタスク全体を開き直す。

## ChatGPT からの移行

1. Claude で **Settings → Capabilities → Import memory from other AI providers** を開き、プロンプトをコピーする。
2. ChatGPT で **Thinking** モードをオンにし、*保存されたメモリ / チャット履歴の参照* に関する3つの設定がオンになっていることを確認してから、プロンプトを貼り付ける。
3. ChatGPT の回答を Claude に貼り戻し、**Add to memory** をクリックする。

## あまり使われていない機能

- **1つのリクエストで複数モデル**：「Web 調査は Sonnet で、PDF の要約は Opus で」とするとトークンを節約できる。
- チャット内での**インタラクティブな図解**（「ニューラルネットワークを図で説明して」）。HTML でダウンロードできる。
- Cowork プロジェクトの**フォルダ指示**と、**複数フォルダ**の同時選択。
- **スケジュールタスク**（「毎日午前11時にこれを実行して」）、**グローバル指示**、メモリ。

---

> 🌐 *Claudeによる翻訳*
