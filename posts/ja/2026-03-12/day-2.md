---
title: "2日目"
date: "2026-03-12"
excerpt: "Keystatic CMSの導入、i18nリダイレクトの修正、RailsとClaude Codeのコツを学び、DDIA第2章を読んだ。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "keystatic", "cms", "nextjs", "i18n", "rails", "claude-code", "ddia", "databases"]
coverImage: "https://images.unsplash.com/photo-1483736762161-1d107f3c78e1?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
---

## 今日やったこと：

- プロジェクトにKeystatic を導入し、ブログ記事を管理できるようにした。ヘッドレスCMSで、ブログ記事を一元管理できる。ただし、まだAI連携がないため、使い続けるかどうかは未定。
- 記事が書かれた言語とは異なる言語でアクセスした際のリダイレクト問題を修正した。
- **複利エンジニアリング（compound engineering）** について学んだ。小さく一貫した改善を積み重ねることで、複利のように時間とともに大きな成果に繋がるという考え方。各改善が前の改善の上に積み重なるため、価値は線形ではなく指数関数的に成長する。
- John Kimによる[How a Meta Staff Engineer Uses Claude Code](https://www.youtube.com/watch?v=mZzhfPle9QU)を視聴した。手動コーディングからClaude Codeを使ったエージェント型オーケストレーションへ移行するための50のコツを紹介していた。[メモを書いた](/ja/posts/how-a-meta-staff-engineer-use-claude-code)。
- Railsでは、`dependent: :nullify`を使うカラムにはデータベースインデックスを付けるべきだと学んだ。例えば、`User`が`comments`を`dependent: :nullify`で持っている場合、ユーザーを削除すると`UPDATE comments SET user_id = NULL WHERE user_id = ?`が実行される。`comments.user_id`にインデックスがないと、フルテーブルスキャンが発生してしまう。
- `CLAUDE.md`ファイルをルートだけでなく特定のサブディレクトリに配置することで、トークンを節約できると学んだ。一部のファイルにのみ適用されるルール（例：`app/controllers/CLAUDE.md`にパラメータバリデーションのパターンや、各メソッドの上にHTTPオペレーションとパスを記載するコメント規約を書く）は、Claudeがそのフォルダで作業するときだけ読み込まれる。
- 調子が悪い日だった。簡単なミスが多すぎた。主にコードが仕様と合っていなかった。明日はもっとうまくやる。
- *Designing Data-Intensive Applications* の第2章（データモデルとクエリ言語）を読んだ。[メモを書いた](/ja/posts/ddia-chapter-2-data-models-and-query-languages)。

---
*Claudeによる翻訳*
