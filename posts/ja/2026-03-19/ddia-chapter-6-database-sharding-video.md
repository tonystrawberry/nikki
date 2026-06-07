---
title: "Database Sharding! Designing Data-Intensive Applications 第6章"
date: "2026-03-19"
excerpt: "DDIA 第6章（パーティショニング/シャーディング）の動画解説：key-range vs hash、セカンダリインデックス、リバランス、リクエストルーティングの図解。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "partitioning", "sharding", "distributed-systems", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=iR07_nnzvQg"
collection: "ddia"
collectionOrder: 6
collectionTitle: "Designing Data-Intensive Applications"
---

## 概要

*Designing Data-Intensive Applications* の **第6章（パーティショニング）** の動画解説。著者は図を使ってパーティショニング（一般的にはシャーディング）を説明：複数マシンへのデータ分割。書籍では「partitioning」、実務では「sharding」と表現されることが多い。

## 扱っているトピック

- **パーティショニング vs シャーディング：** 同じ概念。1ディスク上のテーブル分割か、マシン間でのデータ分散か。ここでは分散。
- **パーティショニング戦略：** key-range（例：A–M、N–Z）vs hash。レンジクエリと負荷分散のトレードオフ。
- **セカンダリインデックス：** パーティション時のローカル（scatter-gather）vs グローバルインデックス。
- **リバランス：** ノード追加・削除時のパーティション移動。固定パーティション、動的、比例パーティショニング。
- **リクエストルーティング：** クライアントがキーに対応するノードを見つける方法（ルーティング層、gossip、クライアント側メタデータ）。

## 要点

- パーティショニング（シャーディング）は書き込みスループットとストレージを1台以上にスケールさせる。レプリケーションと組み合わせて使う。
- ハッシュパーティションはホットスポットを避けるがレンジスキャンが効かなくなる。key-range はその逆。
- パーティショニング時のセカンダリインデックスは scatter-gather（ローカル）か、より複雑な書き込み（グローバル）が必要。
- リバランスはデータ移動を抑え、単一障害点を避ける設計にすべき。

---
*Claudeによる翻訳*
