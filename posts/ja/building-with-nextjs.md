---
title: "このサイトをNext.jsで作りました"
date: "2025-12-28"
excerpt: "このデジタル日記をどのように構築したか、そしてなぜNext.jsを選んだのか。"
author: "Tony Duong"
category: "tech"
tags: ["nextjs", "react", "個人プロジェクト"]
coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop"
---

# このサイトをNext.jsで作りました

この日記を書き始める前に、数日かけてサイトを構築しました。どのように作ったかをご紹介します。

## なぜ自分でサイトを作るのか？

Medium、Substack、または単純なWordPressブログを使うこともできました。でも、完全にコントロールできる、本当に個人的なものが欲しかった。

休暇中に楽しいプロジェクトをコーディングする口実でもあります。😄

## 技術スタック

```javascript
const stack = {
  framework: 'Next.js 15',
  styling: 'Tailwind CSS + shadcn/ui',
  content: 'Markdown + gray-matter',
  i18n: 'Français, English, 日本語'
};
```

### なぜNext.js？

- **App Router** — Reactアプリを構造化する新しい方法
- **Server Components** — 最適なパフォーマンス
- **簡単なデプロイ** — `git push`だけで公開

## 学んだこと

このプロジェクトで、なぜコーディングが好きなのかを思い出しました。「ただの」ブログであっても、ゼロから何かを作り上げることには満足感があります。

一番難しかったこと？色を選ぶこと。本気で、コードよりもカラーパレットに時間を使いました。🎨

---

*次のステップ：コードの話をする代わりに本物のコンテンツを書く。*
