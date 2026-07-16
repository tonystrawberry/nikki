---
title: "POODR Chapitre 4 : Créer des interfaces flexibles"
date: "2026-07-15"
excerpt: "Concevoir les messages entre objets — interfaces publiques vs privées, demander le « quoi » et non le « comment », l'indépendance au contexte et la loi de Déméter."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "interfaces", "law-of-demeter", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 4
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Les trois premiers chapitres se concentraient sur la conception des classes individuelles — ce que les objets *savent*. Le chapitre 4 se tourne vers ce que les objets *se disent entre eux*. Une application se définit autant par ses motifs de messages que par ses classes. Ce chapitre traite de la conception des **interfaces** : les messages qu'un objet est prêt à recevoir.

## Deux sortes d'interface

Le mot « interface » désigne ici l'ensemble des messages auxquels un objet répond. Chaque classe en possède deux :

- **Interface publique** — les méthodes qui constituent la responsabilité première de la classe. Elles sont stables, sûres pour que d'autres en dépendent, et rigoureusement testées. C'est le « visage » de la classe vis-à-vis du monde.
- **Interface privée** — les détails internes d'implémentation. Elles peuvent changer sans préavis, ne sont pas destinées à être appelées par d'autres, et ne devraient pas apparaître dans les tests écrits par des tiers.

Une bonne interface publique révèle *ce que* fait une classe tout en cachant *comment* elle le fait. Pensez au menu d'un restaurant : il liste les plats que vous pouvez commander, pas les recettes.

## Trouver l'interface publique : objets du domaine vs messages

Le chapitre utilise l'exemple d'une « sortie à vélo » (un `Customer` veut voir les circuits disponibles d'une certaine difficulté). Il est tentant de commencer par lister les **objets du domaine** évidents — `Customer`, `Trip`, `Bicycle`, `Mechanic`. Ces noms sont réels et faciles à repérer, mais ils constituent un piège : se focaliser sur les noms vous pousse à attribuer un comportement à la première classe que vous avez remarquée, plutôt qu'à celle qui *devrait* le posséder.

Au lieu de cela, **concevez d'abord les messages.** Utilisez des diagrammes de séquence pour vous demander : étant donné ce message, qui devrait y répondre ? Cela renverse la question de « je sais que j'ai besoin de cette classe, que devrait-elle faire ? » vers « j'ai besoin d'envoyer ce message, qui devrait y répondre ? ». Concevoir la conversation révèle les objets — et non l'inverse.

> La question clé de conception n'est pas « de quels objets ai-je besoin ? » mais « quels messages sont envoyés, et qui devrait y répondre ? »

## Demander le « quoi », pas le « comment »

Une distinction cruciale : un message peut demander à un objet *ce qu'*il veut (en faisant confiance au destinataire pour trouver comment), ou il peut dicter *comment* le destinataire doit faire son travail.

Lorsqu'un `Trip` indique à un `Mechanic` exactement quelles étapes exécuter pour préparer chaque vélo, `Trip` est couplé à la procédure du mécanicien — tout changement dans la façon de préparer les vélos force `Trip` à changer. À la place, `Trip` devrait envoyer un unique message révélateur d'intention comme `prepare_bicycles(bicycles)` et laisser `Mechanic` décider des étapes. Faire confiance aux collaborateurs pour satisfaire les demandes, sans les micro-gérer, est au cœur d'une bonne conception orientée objet.

## Rechercher l'indépendance au contexte

Le **contexte** qu'un objet attend, c'est tout ce qu'il doit savoir de ses collaborateurs avant de pouvoir fonctionner. Plus un objet exige de contexte, plus il est difficile à réutiliser et à tester.

L'objectif est l'**indépendance au contexte** : un objet qui sait *ce qu'*il veut mais rien de la manière dont les autres objets le lui fournissent. L'injection de dépendances (du chapitre 3) est l'outil principal — un `Trip` à qui l'on remet un « préparateur » et qui se contente de lui envoyer `prepare_trip(self)` ne se soucie pas de savoir si le préparateur est un mécanicien, un chauffeur ou un cuisinier. Chaque collaborateur demande au circuit ce dont il a besoin.

## La loi de Déméter

La loi de Déméter (Law of Demeter, LoD) restreint les objets auxquels vous pouvez envoyer des messages. Elle interdit les *train wrecks* — de longues chaînes de messages qui traversent un objet pour parler à un objet distant :

```ruby
customer.bicycle.wheel.tire      # violates LoD
customer.bicycle.wheel.rotate    # violates LoD
hash.keys.sort.join(', ')        # arguably fine — see below
```

La version informelle : « ne parlez qu'à vos voisins immédiats », ou « n'utilisez qu'un seul point ». Une méthode peut envoyer des messages à `self`, aux objets passés en arguments, et aux objets qu'elle crée directement — mais elle ne devrait pas fouiller dans les entrailles d'un collaborateur pour en atteindre un autre.

Toute chaîne ne viole pas l'esprit de la loi. `hash.keys.sort.join` est une chaîne, mais chaque appel renvoie *le même genre de chose* et n'atteint pas des objets distants sans rapport, si bien que le coût de couplage est faible. Ce contre quoi la LoD met vraiment en garde, c'est une chaîne de messages qui révèle — et dépend de — la structure interne de vos collaborateurs.

Les train wrecks sont un *symptôme*. Le remède n'est pas de supprimer mécaniquement des points ; c'est de reconnaître que la chaîne trahit un message manquant. Demandez au premier objet ce que vous voulez réellement, et laissez-le déléguer en interne. Cela fait souvent émerger une nouvelle méthode publique utile.

## Points clés à retenir

1. **Distinguez les interfaces publiques des privées** — exposez des méthodes stables qui révèlent le *quoi*, cachez les méthodes volatiles qui implémentent le *comment*.
2. **Concevez les messages avant les objets** — utilisez des diagrammes de séquence et demandez « qui devrait répondre à ce message ? » ; les objets émergent de la conversation.
3. **Concentrez-vous sur les messages, pas sur les noms du domaine** — les classes évidentes sont un point de départ, pas la conception.
4. **Demandez le « quoi » que vous voulez, pas le « comment » l'obtenir** — envoyez des messages révélateurs d'intention et faites confiance aux collaborateurs.
5. **Recherchez l'indépendance au contexte** pour que les objets soient faciles à réutiliser et à tester ; l'injection de dépendances est l'outil principal.
6. **Suivez la loi de Déméter** — évitez les chaînes de messages qui traversent les collaborateurs ; un train wreck signale généralement un message public manquant.

---

> 🌐 *Traduit par Claude*
