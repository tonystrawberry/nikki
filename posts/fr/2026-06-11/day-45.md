---
title: "Jour 45"
date: "2026-06-11"
excerpt: "Visionné deux vidéos Hello Interview — concevoir Dropbox / Google Drive et Kafka vs RabbitMQ — et mis en place un agent Datadog Bits AI pour envoyer un rapport quotidien sur la santé des applications."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "system-design", "distributed-systems", "kafka", "rabbitmq", "message-queue", "datadog", "observability", "llm"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- regardé [System Design Interview: Design Dropbox or Google Drive w/ a Ex-Meta Staff Engineer](/fr/posts/system-design-interview-design-dropbox-google-drive-ex-meta-staff-engineer) — des uploads par URL présignée directement vers le stockage blob, le découpage des gros fichiers en chunks pour permettre la reprise des uploads et la déduplication, et la synchronisation des modifications entre appareils
- regardé [Kafka vs RabbitMQ](/fr/posts/kafka-vs-rabbitmq) — le log vs la queue comme distinction fondamentale, les consumer groups vs la livraison push avec acquittement, et quand opter pour des streams/replay plutôt que pour une file de tâches
- au travail, utilisé le nouvel agent Bits AI de Datadog — qui permet de programmer un agent LLM pour répondre à des questions sur vos logs, métriques et traces — afin de générer un rapport quotidien analysant les données de la veille sur l'ensemble de nos services surveillés, livré chaque matin à 9h30 comme une lecture supplémentaire de la santé des applications en complément de nos monitors et dashboards existants

---

> 🌐 *Traduit par Claude*
