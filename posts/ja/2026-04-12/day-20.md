---
title: "20 日目"
date: "2026-04-12"
excerpt: "Glacier・Vertex TTS・Pokemon Go、DDIA 第7章（トランザクション）の続きなど — 密度が高く、明日続きを読む。"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "s3", "glacier", "cli", "vertex-ai", "gemini", "tts", "shirimono", "pokemon-go", "games", "ddia", "reading", "transactions"]
---

## 今日やったこと：

- AWS S3 Glacier に置いてある古い画像のリストアを始めた — キーを列挙し、各キーに対して `GlacierJobParameters.Tier` を Bulk、7 日間の取得可能ウィンドウで `aws s3api restore-object` を実行し、リストアが終わったらバケットからローカルフォルダへ `aws s3 sync` する予定

```bash
aws s3 ls s3://tonystrawberry-xxxx/ --recursive \
    | awk '{print $4}' \
    | xargs -I {} aws s3api restore-object \
        --bucket tonystrawberry-memories \
        --key "{}" \
        --restore-request '{"Days":7,"GlacierJobParameters":{"Tier":"Bulk"}}'

# once all restored
aws s3 sync s3://tonystrawberry-memories/ ./tonystrawberry-memories/
```

- Vertex AI の Gemini 2.5 Flash TTS モデルで Shirimono 用の音声を生成した
- Pokemon Go を始めた — 暇がなくなりそう
- DDIA 第 7 章（トランザクション）の続きを読んだ — かなり重い；まだ読み切っていないので章メモは書かず、明日続ける

---
*Claudeによる翻訳*
