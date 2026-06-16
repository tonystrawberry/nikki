---
title: "48日目"
date: "2026-06-16"
excerpt: "Boris Cyrulnikの非文明化について視聴し、Hetzner移行後のShirimono Apple認証を修正 — PEMの改行がリテラル\\nとして保存されていた。"
author: "Tony Duong"
category: "daily"
tags: ["psychology", "parenting", "education", "family", "screens", "society", "shirimono", "apple", "authentication", "hetzner", "deployment", "debugging"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- [家族、学校、スクリーン — Boris Cyrulnikの警鐘](/ja/posts/family-school-screens-boris-cyrulnik-warning) を視聴 — 非文明化、幼児期の最初の1000日、スクリーン時間とうつ、家族の断絶、共感の儀式の再発明について
- ShirimonoのApple認証を修正 — RenderからHetznerへ移行して環境変数をコピーしたが、本番の `APPLE_PRIVATE_KEY` にPEMがリテラル `\n` として入っていて実際の改行になっていなかった；原因が分かれば簡単な修正だったが、デバッグは骨だった

---

> 🌐 *Claudeによる翻訳*
