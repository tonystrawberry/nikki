---
title: "KiroのSpec-Driven Development: 機能とできること"
date: "2026-04-14"
excerpt: "初めて受講したAWS Skill Builderコースのメモ。Kiroのspec-drivenワークフロー、主要機能、実務での使いどころを整理。"
author: "Tony Duong"
category: "note"
tags: ["aws", "skillbuilder", "kiro", "spec-driven-development", "ai", "engineering"]
---

## 概要

初めての AWS Skill Builder コース **Spec-Driven Development with Kiro** を完了し、このメモでは特に印象に残った中核機能をまとめる。

中心となる考え方はシンプルで、場当たり的なプロンプトから始めるのではなく、最初に意図・制約・期待結果を定義し、spec を source of truth として維持しながら AI と反復するというもの。

## 実務での "spec-driven" の意味

Kiro の spec-driven 開発で重視されるのは次の点：

- 実装前に要件を明確に書く
- 受け入れ基準を明示する
- 開発者と AI の共通コンテキストとして spec を使う
- 初期契約に照らして実装を検証する

これにより「依頼したこと」と「実際に出荷したもの」のズレを減らせる。

## 特に有用だと感じたKiroの機能

## 1) 要件整理の構造化

Kiro はタスクを次の要素に分解しやすくする：

- objective
- scope
- constraints
- expected outputs

この枠組みにより、プロンプト品質が上がり、曖昧な AI 応答が減る。

## 2) spec の反復的な洗練

一発生成ではなく、複数パスで spec を磨く流れを促す：

- 曖昧な要件を絞る
- 抜けている edge case を追加する
- non-goal を明確化する

この反復で、後段の実装信頼性が上がる。

## 3) spec から成果物までのトレーサビリティ

大きな利点は、次の対応関係を明確に保てること：

- 要件記述
- 生成された実装
- 検証フィードバック

特にチーム開発で、レビューと引き継ぎがしやすくなる。

## 4) 検証に対するより良いマインドセット

このコースは、生成コード量ではなく挙動を検証する姿勢を強化する：

- 受け入れ基準に対して検証する
- edge case を明示的にテストする
- AI 出力は正しさが確認されるまでドラフトとして扱う

## 日々の開発で活かせるポイント

- feature チケットに Kiro 風 spec テンプレートを使う
- すべての AI コーディング依頼に constraints と non-goal を含める
- AI 実装依頼前に "done" 条件を定義する
- 各変更を spec に結びつける短いレビューループを回す

## 要点

- spec の質が AI 出力の質を強く決める
- 制約を明示すると正確性が上がり rework が減る
- 非自明タスクでは one-shot prompting より反復的洗練が有効
- Kiro のアプローチは AI ツール利用だけでなく、開発コミュニケーション全体の明瞭化にも有効

---
*Claudeによる翻訳*
