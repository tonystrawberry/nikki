---
title: "Day 20"
date: "2026-04-12"
excerpt: "Glacier, Vertex TTS, Pokemon Go, and more DDIA ch.7 (transactions) — dense read, finishing tomorrow."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "s3", "glacier", "cli", "vertex-ai", "gemini", "tts", "shirimono", "pokemon-go", "games", "ddia", "reading", "transactions"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Today, I:

- initiated a restore of some very old images stored in AWS S3 Glacier — listed keys, ran `aws s3api restore-object` per key with `GlacierJobParameters.Tier` set to Bulk and a 7-day availability window, then planned to run `aws s3 sync` from the bucket to a local folder once the restores finish

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

- used Vertex AI with the Gemini 2.5 Flash TTS model to generate audio for Shirimono
- started playing Pokemon Go — guess my free time will be busy from now on
- continued reading DDIA chapter 7 on transactions — very heavy; not writing a memo yet since I'm not done, will continue tomorrow
