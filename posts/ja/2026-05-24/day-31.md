---
title: "31日目"
date: "2026-05-24"
excerpt: "RailsアップグレードのためのClaude Codeスキル、6時間のApache Sparkディープダイブの前半、そして/ja/chatで動くClaude搭載のストリーミングチャット。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "spark", "big-data", "ai", "claude", "nextjs"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- Ruby Weekly経由で[ombulabs/claude-code_rails-upgrade-skill](https://github.com/ombulabs/claude-code_rails-upgrade-skill)を発見 — Spacelyで予定しているRails 7.2 → 8.1のアップグレードに本当に役立ちそう
- [Apache Spark — The Ultimate Guide](/ja/posts/apache-spark-the-ultimate-guide-from-zero-to-pro)を3:50:46まで視聴 — Ansh Lambaの話し方は面白くて会話っぽく、まるで友達が一緒に説明してくれているような感じで、6時間のコースでも実際に最後まで観られそう。Sparkについてすでにかなり学べたので、残りは明日終わらせる予定
- [/ja/chat](/ja/chat)にチャット機能をリリース — Next.jsのストリーミングAPIルートで、Claude Sonnet 4.6のデルタを`ReadableStream`経由でブラウザに直接流す仕組み。システムプロンプトはリクエストごとに、キュレーションされたペルソナのMarkdownファイルとアクティブなロケールの全投稿のダイジェスト（タイトル、日付、カテゴリ、タグ、抜粋）から再構築し、すべて`cache_control: ephemeral`で包んでいるので、続くターンはプロンプトキャッシュにヒットする。ユーザーメッセージはZodでバリデーションし、react-markdownでストリーミングされた吹き出しをレンダリング。これは本当の*デジタルクローン*というよりは、このサイトのコンテンツで強化されたLLMという感じ。同じUIはfrとjaでも提供中

---
> 🌐 *Claudeによる翻訳*
