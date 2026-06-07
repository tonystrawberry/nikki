---
title: "Day 43"
date: "2026-06-07"
excerpt: "Datadogのモニターを約120個整理し、DDIAの最終章を読み終え、Uberのシステム設計ウォークスルーに加えて成功とミニマリズムについての動画を観た。そして大きな決断をした——日本での8年間を経て、トゥールーズに戻ることにした。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "learning", "productivity", "minimalism", "philosophy", "datadog", "monitoring", "observability", "ddia", "reading", "distributed-systems", "personal", "toulouse", "japan", "relocation", "career", "system-design", "uber"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- [Success Is Not About Trying Hard](/ja/posts/success-is-not-about-trying-hard) を観た——成功は力任せの努力ではなく、意図的な継続にランダム性・直感・振り返りが組み合わさって生まれるという考察。実践的な例もある（問題を繰り返し解くことでマークシート式の試験を攻略する、ビデオゲーム、YouTubeチャンネルの運営など）
- [Why I Live a Simple Minimalist Life](/ja/posts/why-i-live-a-simple-minimalist-life) を観た——かつて宝石商だったTheoは、今では所有物が9.6kgしかなく、庭仕事のボランティアと引き換えに寝食を得て暮らしている。ものを（そして重いキーホルダーを）手放したことで、希望や喜び、そして自分自身の誠実さとの平穏な関係をどう得たかについて語っている
- 仕事では、既存の約120個のDatadogモニターをすべて整理した——一貫性のない命名（英語と日本語が混在し、冗長すぎるものもあった）を修正し、BEチームが注視すべきものを示すタグ付けを追加し、カテゴリ（ANOMALY、LATENCYなど）を導入した。新しいモニターも追加し、その中には*ジョブごと*のエラー数がしきい値を超えたときにアラートを出すものもあり、これによって障害が起きているジョブを即座に特定できるようになった——その過程でDatadogのモニタリングについて多くを学んだ
- ついに *Designing Data-Intensive Applications* の最終章を読み終えた——[DDIA Chapter 12: The Future of Data Systems](/ja/posts/ddia-chapter-12-the-future-of-data-systems)——これで本全体を読了。数か月かけて取り組んできた、大きな節目だ
- 大きな決断をした：日本での8年間を経て、パートナーと私はトゥールーズに戻り、そこでの暮らしの方が自分たちにとって良いかどうかを試してみることにした——Spacelyではパートタイムで働き続ける予定だが、ヨーロッパでリモートの仕事を見つける必要があるかもしれない
- [System Design Interview: Design Uber w/ a Ex-Meta Staff Engineer](/ja/posts/system-design-interview-design-uber-ex-meta-staff-engineer) を観た——最も難しい近傍検索問題に対するHello Interviewのアプローチ：クアッドツリーによる地理空間インデックス（PostGIS）、動的更新によって約60万件/秒（TPS）の位置情報更新をさばく方法、そしてマッチングの整合性を保つためのドライバーロック（DynamoDBのTTL）について

---

> 🌐 *Claudeによる翻訳*
