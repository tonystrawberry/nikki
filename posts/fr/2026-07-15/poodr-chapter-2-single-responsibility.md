---
title: "POODR Chapitre 2 : Concevoir des classes à responsabilité unique"
date: "2026-07-15"
excerpt: "Faire en sorte qu'une classe ne fasse qu'une seule chose — le SRP, le test TRUE, cacher les variables d'instance derrière des méthodes et isoler les structures de données pour que le changement reste peu coûteux."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "single-responsibility", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 2
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Le chapitre 2 traite du premier objectif, le plus fondamental : construire des classes qui ne font qu'une seule chose. Une classe à **responsabilité unique** est facile à réutiliser et facile à modifier, car tout ce qu'elle contient change pour la même raison. Ce chapitre utilise le désormais célèbre exemple de bicyclette `Gear`/`Wheel` pour montrer comment trouver, isoler et nettoyer les responsabilités.

## Décider de ce qui appartient à une classe

La partie difficile de la conception au début n'est pas de savoir *comment* écrire une classe, mais *quoi* y mettre. Le conseil de Metz : il est plus important d'organiser le code pour qu'il soit facile à modifier que d'obtenir la conception parfaite dès le départ. Visez un code qui soit **TRUE** :

- **T**ransparent — les conséquences d'un changement sont évidentes.
- **R**easonable (raisonnable) — le coût d'un changement est proportionnel à son bénéfice.
- **U**sable (utilisable) — le code peut être réutilisé dans des contextes nouveaux et inattendus.
- **E**xemplary (exemplaire) — le code encourage ceux qui le modifient à perpétuer de bonnes habitudes.

Pour y parvenir, on applique le **Single Responsibility Principle** (SRP) : une classe doit faire la plus petite chose utile possible, et n'avoir qu'une seule raison de changer.

## Pourquoi la responsabilité unique est importante

Une classe qui fait trop de choses est difficile à réutiliser — vous ne pouvez pas récupérer uniquement le comportement souhaité sans traîner tout le reste avec. Lorsque vous êtes tenté de copier juste une méthode dans un nouveau contexte, c'est un signe que la classe fait plus d'une chose.

Des responsabilités fortement couplées rendent aussi la classe fragile : un changement destiné à un comportement peut accidentellement en casser un autre, sans rapport.

## Comment savoir si une classe a une responsabilité unique

Deux techniques pratiques :

1. **Interrogez-la comme une phrase.** Demandez à la classe ses méthodes et reformulez-les en questions : « Je vous en prie, M. Gear, quel est votre `ratio` ? » a du sens. « Je vous en prie, M. Gear, quel est votre `gear_inches` ? » est à la limite. « Je vous en prie, M. Gear, quelle est votre `tire_size` ? » n'a clairement pas de sens — la taille du pneu appartient à une roue, pas à un engrenage.
2. **Décrivez-la en une seule phrase.** Si la description la plus simple utilise le mot « et », la classe a probablement plus d'une responsabilité. Si elle utilise « ou », les responsabilités ne sont même pas liées. Une bonne description de classe contient un but unique et cohérent.

## Écrire du code qui embrasse le changement

Même avant de connaître la conception finale, vous pouvez écrire du code qui reste flexible.

### Dépendre du comportement, pas des données

**Cachez les variables d'instance.** Ne faites jamais référence directement aux `@variables` à l'intérieur des méthodes — enveloppez-les dans des méthodes d'accès pour qu'il n'y ait qu'un seul endroit où la donnée est définie :

```ruby
class Gear
  attr_reader :chainring, :cog   # creates wrapper methods

  def initialize(chainring, cog)
    @chainring = chainring
    @cog = cog
  end

  def ratio
    chainring / cog.to_f   # use the method, not @chainring
  end
end
```

Ainsi, si la signification de `cog` doit un jour changer, vous modifiez une seule méthode au lieu de traquer chaque référence.

**Cachez les structures de données.** Si une classe reçoit une structure complexe (disons un tableau de tableaux à deux éléments pour des roues), ne dispersez pas des références par index comme `wheel[0]` et `wheel[1]` partout. Chaque référence dépend de la disposition exacte de la structure. À la place, enveloppez-la dans un `Struct` pour que chaque élément ait un nom :

```ruby
class ObscuringReferences
  attr_reader :data
  def initialize(data)
    @data = data
  end

  def diameters
    data.collect { |cell| cell[0] + (cell[1] * 2) }  # what is [0]? [1]?
  end
end

class RevealingReferences
  attr_reader :wheels
  def initialize(data)
    @wheels = wheelify(data)
  end

  def diameters
    wheels.collect { |wheel| wheel.rim + (wheel.tire * 2) }  # clear!
  end

  Wheel = Struct.new(:rim, :tire)
  def wheelify(data)
    data.collect { |cell| Wheel.new(cell[0], cell[1]) }
  end
end
```

La structure ne vit désormais qu'à un seul endroit.

## Appliquer la responsabilité unique partout

La même discipline s'applique en dessous du niveau de la classe :

- **Extrayez les responsabilités superflues des méthodes.** Les méthodes, comme les classes, doivent faire une seule chose. Des méthodes petites, à but unique, révèlent des qualités cachées de la classe, évitent les commentaires et sont faciles à réutiliser et à déplacer.
- **Isolez les responsabilités superflues dans des classes.** Lorsqu'une méthode ou une structure embarquée laisse entrevoir un nouveau concept (comme `Wheel` vivant à l'intérieur de `Gear`), extrayez-le — même dans un petit `Struct` au début. Vous n'avez pas à vous engager immédiatement dans une nouvelle classe complète ; isolez simplement l'idée pour qu'elle soit prête à être déplacée le moment venu.

Le bénéfice : la future classe `Wheel` s'écrit pratiquement toute seule, car la responsabilité était déjà proprement isolée.

## Points clés à retenir

1. **Une classe doit avoir une responsabilité unique** — une seule raison de changer — ce qui la rend réutilisable et sûre à modifier.
2. **Testez le SRP** en interrogeant les méthodes sous forme de questions et en décrivant la classe en une phrase ; méfiez-vous de « et » et « ou ».
3. **Visez un code TRUE** : Transparent, Reasonable, Usable, Exemplary.
4. **Cachez les variables d'instance derrière des méthodes d'accès** pour que la donnée ait un unique point de définition.
5. **Cachez les structures de données complexes** (par ex. avec `Struct`) afin que les références ne dépendent pas de la disposition.
6. **Appliquez aussi la responsabilité unique dans les méthodes** — des méthodes petites et ciblées rendent l'extraction et la réutilisation futures peu coûteuses.
7. **Isolez tôt les responsabilités émergentes**, même avant d'être prêt à créer une nouvelle classe complète.

---

> 🌐 *Traduit par Claude*
