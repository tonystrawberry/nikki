---
title: "バックエンドエンジニアに転身させてくれた7冊"
date: "2026-03-19"
excerpt: "バックエンドスキルアップに役立つ7冊の紹介：Clean Code、The Pragmatic Programmer、DDIA、System Design Interview、Database Internals、Release It、Fundamentals of Software Architecture。"
author: "Tony Duong"
category: "note"
tags: ["books", "backend", "career", "software-engineering", "video"]
youtubeUrl: "https://www.youtube.com/watch?v=ReNqPp3EmYk"
---

## 概要

ソフトウェア工学を学ぶうえで **本は最も活用されていないリソース** だという主張の動画。何かが壊れたとき、大半は ChatGPT や Claude に走るが、本を開く人は少ない。著者がバックエンドスキルを高めるうえで役立った **7冊** を紹介している。

## 7冊の本

1. **Clean Code**（Robert C. Martin / Uncle Bob）— 命名、可読性、コードを読む時間が書く時間の約10倍という考え方。汚いコードは毎週何時間もロスする。命名に関する章が丸々ある。

2. **The Pragmatic Programmer**（Hunt & Thomas）— 構文もフレームワークもなし。1999年の本だが、バージョン管理、自動化、CI/CD など現代エンジニアの教科書として読める。DRY と普遍的なプラクティスを導入。

3. **Designing Data-Intensive Applications (DDIA)**（Martin Kleppmann）— 「バックエンドの聖書」と呼ばれる。PostgreSQL や Cassandra の使い方ではなく、障害時に **なぜ** そう振る舞うかを説明。読後、分散システムが当て推量ではなく理解できるようになる。

4. **System Design Interview**（Alex Xu）— 面接対策であり、システムアーキテクチャのプレイブック。一章（例：ニュースフィードアーキテクチャ）で、実務のパフォーマンスボトルネックを解くモデルが身につく。

5. **Database Internals**（Alex Petrov）— ほとんどのバックエンド開発者は日々DBに触れるが、内部の動きは知らない。B-tree、ストレージエンジン、コンセンサスアルゴリズムを扱う。PostgreSQL がハッシュより B-tree インデックスをデフォルトにする理由が分かると、意図せず遅いクエリを書かなくなる。核となる考え：どのDBも「どう保存するか」「どう取り出すか」「どう失わないか」の3問を解いている。

6. **Release It**（Michael Nygard）— コードを書くことではなく、本番で動いたときに何が起きるか。カスケード障害はなぜ起きるか。circuit breaker や bulkhead など、1つ壊れたサービスが全体を巻き込まないパターンを紹介。

7. **Fundamentals of Software Architecture**（Mark Richards & Neil Ford）— ただコードを書くのをやめて、「なぜこの構成なのか」を問い始めるとき向け。マイクロサービス、イベント駆動、レイヤードシステムとそのトレードオフ。

## 要点

- 本はバックエンド・システムスキルのために活用されていない強力なリソース。
- Clean Code と The Pragmatic Programmer は命名・DRY・ツールといった習慣を積み上げる。
- DDIA と Database Internals はシステムがその挙動をする **理由** を説明し、当て推量を減らす。
- System Design Interview と Fundamentals of Software Architecture はコーディングとアーキテクチャを橋渡しする。
- Release It は本番の耐障害性と障害モードに触れる。

---
*Claudeによる翻訳*
