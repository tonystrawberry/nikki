---
title: "8日目"
date: "2026-03-18"
excerpt: "MIT/Anthropic の AI コーディング限界を視聴、DDIA 第6章（パーティショニング）を読了。"
author: "Tony Duong"
category: "daily"
tags: ["ai", "coding", "benchmarks", "mit", "anthropic", "ddia", "databases", "partitioning"]
---

**視聴：** [MIT, Anthropic, and New Benchmarks Just Revealed AI's Biggest Coding Limits](https://www.youtube.com/watch?v=BAlSzHFmmwU)（〜3:26 から）。

MIT と Anthropic の研究は、AI コーディングがまだ苦手な点を浮き彫りにしている：SWE-Bench のようなベンチマークはゲーム可能で、スコアの高いモデルも他言語や実運用では失敗しがち。自動評価は実性能を過大評価しがちで、エージェントはテストは通すがフォーマット・リント・カバレッジの問題を抱えたコードを出す。業界の主張にもかかわらず、実際のコーディング限界と生産性向上はまだ不明確。

## 今日やったこと：

- [DDIA 第6章：パーティショニング](/ja/posts/2026-03-18/ddia-chapter-6-partitioning) を読んだ — パーティション戦略（キー範囲 vs ハッシュ）、セカンダリインデックス（ローカル vs グローバル）、リバランス、リクエストルーティング

---
*Claudeによる翻訳*
