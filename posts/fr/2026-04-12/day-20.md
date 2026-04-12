---
title: "Jour 20"
date: "2026-04-12"
excerpt: "Glacier, Vertex TTS, Pokemon Go, et lecture du ch.7 de DDIA (transactions) — chapitre dense, je reprends demain."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "s3", "glacier", "cli", "vertex-ai", "gemini", "tts", "shirimono", "pokemon-go", "games", "ddia", "reading", "transactions"]
---

## Aujourd'hui, j'ai :

- lancé une restauration d’anciennes images stockées dans AWS S3 Glacier — listé les clés, exécuté `aws s3api restore-object` pour chaque clé avec `GlacierJobParameters.Tier` sur Bulk et une fenêtre de disponibilité de 7 jours, puis prévu de lancer `aws s3 sync` du bucket vers un dossier local une fois les restaurations terminées

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

- utilisé Vertex AI avec le modèle Gemini 2.5 Flash TTS pour générer de l’audio pour Shirimono
- commencé à jouer à Pokemon Go — mon temps libre va sans doute être pris
- poursuivi la lecture du chapitre 7 de DDIA sur les transactions — très dense ; pas encore de mémo de chapitre car je n’ai pas terminé, je continue demain

---
*Traduit par Claude*
