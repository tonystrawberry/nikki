---
title: "POODR Chapitre 3 : Gérer les dépendances"
date: "2026-07-15"
excerpt: "Reconnaître, isoler et inverser les dépendances — injection de dépendances, dépendre d'abstractions, et choisir la direction que les dépendances devraient pointer."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "dependencies", "dependency-injection", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 3
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Puisque les objets doivent collaborer pour accomplir quoi que ce soit d'utile, les dépendances sont inévitables. Le chapitre 3 traite de la façon de garder ces dépendances sous contrôle : reconnaître quand elles existent, les minimiser et — surtout — les organiser pour que chaque classe dépende de choses moins susceptibles de changer qu'elle-même.

## Reconnaître les dépendances

Un objet a une dépendance envers un autre lorsque, si cet autre objet change, cet objet pourrait être contraint de changer aussi. Metz énumère quatre types de dépendances qu'un objet devrait éviter de connaître :

1. **Le nom d'une autre classe.** (`Gear` s'attend à ce qu'une classe nommée `Wheel` existe.)
2. **Le nom d'un message qu'il a l'intention d'envoyer** à autre chose que `self`. (`Gear` s'attend à ce que `Wheel` réponde à `diameter`.)
3. **Les arguments qu'un message requiert.** (`Gear` sait que `Wheel.new` a besoin d'un `rim` et d'un `tire`.)
4. **L'ordre de ces arguments.** (`Gear` sait que `rim` vient avant `tire`.)

Chaque élément de connaissance couple les deux classes. Un certain couplage est nécessaire, mais chaque dépendance inutile rend la classe plus difficile à modifier et à réutiliser.

Voici le point de départ, fortement couplé :

```ruby
class Gear
  def initialize(chainring, cog, rim, tire)
    @chainring = chainring
    @cog = cog
    @rim = rim
    @tire = tire
  end

  def gear_inches
    ratio * Wheel.new(rim, tire).diameter   # too many dependencies!
  end
end
```

`Gear` connaît le *nom de la classe* `Wheel`, le *message* `diameter`, ainsi que les *arguments* (et leur *ordre*) dont `Wheel.new` a besoin.

## Le couplage entre objets

Plus `Gear` en sait sur `Wheel`, plus les deux sont fortement couplés. Des objets fortement couplés se comportent comme une seule entité — vous ne pouvez pas réutiliser ni tester l'un sans traîner l'autre, et un changement dans l'un se répercute sur l'autre. Les techniques ci-dessous desserrent ce couplage.

## Écrire du code faiblement couplé

### Injecter les dépendances

Au lieu de coder en dur le nom de la classe `Wheel` à l'intérieur de `Gear`, passez-lui un objet wheel. `Gear` n'a pas besoin de savoir *quel type* d'objet il détient — seulement qu'il répond à `diameter` :

```ruby
class Gear
  attr_reader :chainring, :cog, :wheel
  def initialize(chainring, cog, wheel)
    @chainring = chainring
    @cog = cog
    @wheel = wheel
  end

  def gear_inches
    ratio * wheel.diameter   # any object that responds to `diameter`
  end
end

Gear.new(52, 11, Wheel.new(26, 1.5)).gear_inches
```

C'est l'**injection de dépendances** (dependency injection). `Gear` est désormais découplé de `Wheel` et fonctionne avec tout ce qui est assez « duck-like » pour répondre à `diameter`.

### Isoler les dépendances

Si vous ne pouvez pas supprimer une dépendance, isolez-la pour qu'elle soit visible et contenue.

- **Isoler la création d'instance.** Si vous ne pouvez vraiment pas injecter l'objet, créez-le au moins dans la méthode `initialize` (ou dans une méthode dédiée) plutôt qu'au fond d'une méthode de logique métier comme `gear_inches`.
- **Isoler les messages externes vulnérables.** Enveloppez les messages envoyés à d'autres objets dans votre propre méthode, afin qu'un changement externe ne touche qu'un seul endroit :

```ruby
def gear_inches
  ratio * diameter
end

def diameter
  wheel.diameter   # the one place that knows wheel responds to `diameter`
end
```

### Supprimer les dépendances sur l'ordre des arguments

Les arguments positionnels à ordre fixe sont fragiles — réorganisez le constructeur et chaque appelant casse. Utilisez les **arguments nommés** (keyword arguments) pour que l'ordre cesse d'avoir de l'importance et que chaque argument soit nommé au point d'appel :

```ruby
class Gear
  def initialize(chainring:, cog:, wheel:)
    @chainring = chainring
    @cog = cog
    @wheel = wheel
  end
end

Gear.new(chainring: 52, cog: 11, wheel: Wheel.new(26, 1.5))
```

Lorsque vous ne possédez pas la classe dont les arguments sont à ordre fixe, enveloppez-la dans une **méthode fabrique** (factory method) qui masque l'ordre, afin que la dépendance vive à un seul endroit.

## Gérer la direction des dépendances

Chaque dépendance a une direction — vous pouvez généralement l'inverser. `Gear` pourrait dépendre de `Wheel`, ou `Wheel` pourrait dépendre de `Gear`. Comment choisir ?

**Dépendez de choses qui changent moins souvent que vous.** Trois idées guident le choix :

- Certaines classes sont **plus susceptibles de changer** que d'autres.
- Certaines sont **dépendues par beaucoup** d'autres classes (elles ont de nombreux dépendants).
- Il est dangereux de dépendre d'une classe qui est à la fois **susceptible de changer** *et* **largement dépendue** — un changement là-bas provoque des ruptures étendues.

La règle générale : **dépendez dans la direction de la stabilité.** Les abstractions sont plus stables que les concrétions, alors dépendez des abstractions. Les classes de framework et les bibliothèques matures changent moins que votre propre code applicatif volatil, il est donc généralement sûr d'en dépendre.

## Points clés à retenir

1. **Une dépendance existe lorsqu'un changement dans un objet peut forcer un changement dans un autre** — surveillez la connaissance des noms de classes, des noms de messages et des listes/ordre d'arguments.
2. **Injectez les dépendances** pour qu'une classe dépende d'un *message* (un rôle), et non d'une *classe* concrète.
3. **Isolez les dépendances** que vous ne pouvez pas supprimer — contenez la création d'instance et les messages externes dans des méthodes dédiées.
4. **Supprimez les dépendances sur l'ordre des arguments** avec les arguments nommés ; enveloppez les constructeurs externes à ordre fixe dans des méthodes fabriques.
5. **Gérez la direction des dépendances** : dépendez de choses plus stables et moins susceptibles de changer que vous.
6. **Dépendez d'abstractions, pas de concrétions** — c'est l'idée de Dependency Inversion mise en pratique.

---

> 🌐 *Traduit par Claude*
