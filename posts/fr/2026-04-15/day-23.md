---
title: "Jour 23"
date: "2026-04-15"
excerpt: "j'ai écrit un article sur un bug de lost update dans spacely_web qui n'avait pas été résolu depuis des années"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "rails", "concurrency", "mysql", "rspec"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- écrit [Lost Updates in a Rails App: What Broke, How We Fixed It, and How We Tested It](/fr/posts/lost-updates-in-a-rails-app-what-broke-how-we-fixed-it-and-how-we-tested-it) à propos du problème de lost update que j'ai rencontré en corrigeant un bug dans `spacely_web` qui n'avait pas été résolu depuis des années — j'y couvre ce qu'est un lost update, pourquoi le REPEATABLE READ d'InnoDB sur MySQL ne vous protège pas d'un read-modify-write sur une colonne JSON, comment deux jobs parallèles fusionnant chacun une clé différente dans `WorkflowRun#progress` finissent par perdre une clé, le correctif `with_lock` que nous avons déployé, et un setup RSpec multi-thread utilisant deux `Queue` pour reproduire la race et montrer la sortie en échec vs en succès

---
> 🌐 *Traduit par Claude*
