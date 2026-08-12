---
title: "Jour 63"
date: "2026-08-12"
excerpt: "Appris la précédence de and vs && en Ruby, le multithreading pour l’IO Rails, la vérité de [] et \"\", et le lien threads / workers / processes / connection pool."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ruby", "rails", "multithreading", "performance", "connection-pool", "puma"]
coverImage: ""
---

## Aujourd'hui, j'ai :

- appris la différence entre `and` et `&&` en Ruby — même idée booléenne, mais précédence différente (`&&` lie plus fort que `and`, donc les mélanger dans des assignments/conditions peut surprendre)
- appris le multithreading dans Rails pour le travail IO-bound (requêtes HTTP, lecture de fichiers) via [cet article Medium](https://medium.com/@mustajabzaheer51/multithreading-in-ruby-on-rails-a-10-performance-boost-5fc3aa914dca) — on peut accélérer ça in-process au lieu de toujours tout envoyer en jobs async
- me suis rappelé qu'en Ruby, dans les ternaires / conditions, `[]` et `""` sont truthy — tout est un objet, et seuls `nil` et `false` sont falsy
- (ré)appris le lien entre threads, workers, processes et le DB connection pool — noté simplement dans [Rails Threads, Workers, Processes, and the DB Connection Pool (ELI5)](/fr/posts/rails-threads-workers-processes-and-connection-pool)

---

> 🌐 *Traduit par Claude*
