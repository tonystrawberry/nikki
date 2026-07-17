---
title: "POODR Chapitre 8 : Combiner des objets par la composition"
date: "2026-07-16"
excerpt: "Construire des objets à partir de parties — composition vs inheritance, la relation has-a, modéliser avec factory et roles, et comment choisir entre inheritance, modules et composition."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "composition", "inheritance", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 8
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

La **composition** est l'acte de combiner des parties distinctes en un tout tel que le tout devient *plus* que la somme de ses parties. En logiciel, cela signifie construire des objets plus grands à partir de plus petits en les *ayant*, plutôt qu'en *étant* eux. Le chapitre 8 reconstruit une dernière fois l'exemple du vélo — cette fois avec la composition plutôt que l'inheritance — puis prend du recul pour donner des conseils concrets sur quand utiliser l'inheritance, les modules ou la composition.

## Composer un vélo à partir de parties

Les chapitres précédents modélisaient les variantes de vélos (`RoadBike`, `MountainBike`) avec une hiérarchie d'inheritance. Mais ce qui varie réellement entre les vélos, ce sont leurs **parties**. Alors qu'au lieu de demander « quel type de vélo est-ce ? », la composition demande « quelles parties ce vélo a-t-il ? »

Le refactoring se déroule en étapes :

1. Un `Bicycle` **has a** (a) un objet `Parts`, et délègue `spares` à celui-ci.

```ruby
class Bicycle
  attr_reader :size, :parts

  def initialize(size:, parts:)
    @size = size
    @parts = parts
  end

  def spares
    parts.spares
  end
end
```

Désormais, `Bicycle` est minuscule. Il est responsable de `size` et détient un objet `Parts`, en lui transmettant le message `spares`. Les différents vélos ne sont qu'un `Bicycle` combiné avec un `Parts` différent.

## L'objet Parts → une collection d'objets Part

`Parts` commence comme une classe qui connaît les pièces individuelles, mais l'étape naturelle suivante est de reconnaître que `Parts` est en réalité une **collection d'objets `Part`**. Chaque `Part` a un `name`, une `description`, et si elle `needs_spare`.

```ruby
class Parts
  attr_reader :parts
  def initialize(parts)
    @parts = parts
  end

  def spares
    parts.select { |part| part.needs_spare }
  end
end

class Part
  attr_reader :name, :description, :needs_spare
  def initialize(name:, description:, needs_spare: true)
    @name = name
    @description = description
    @needs_spare = needs_spare
  end
end
```

`Parts` se comporte maintenant presque comme un tableau — ce qui soulève une question utile : est-ce qu'il *devrait* ressembler à un tableau (voir ci-dessous).

## La factory Parts

Construire manuellement chaque objet `Part` est fastidieux et sujet aux erreurs. Une **factory** — un objet dont le rôle est de fabriquer d'autres objets — encapsule la connaissance de la façon de construire un `Parts` valide à partir de données de configuration simples :

```ruby
module PartsFactory
  def self.build(config, part_class = Part, parts_class = Parts)
    parts_class.new(
      config.collect { |part_config| part_class.new(
        name: part_config[0],
        description: part_config[1],
        needs_spare: part_config.fetch(2, true))
      })
  end
end

road_config = [
  ['chain', '10-speed'],
  ['tire_size', '23'],
  ['tape_color', 'red']
]

road_bike = Bicycle.new(size: 'L', parts: PartsFactory.build(road_config))
```

La factory concentre toute la connaissance de la structure de configuration en un seul endroit. Comme les objets `Part` que la factory produit sont si simples (ils ne font que stocker des données et répondre à `needs_spare`), vous pourriez même remplacer la classe `Part` par un `Struct` créé à l'intérieur de la factory — le reste du code s'en moquerait, car il ne dépend que du *Part duck type* (répond à `name`, `description`, `needs_spare`).

## Aggregation : composition vs. un has-a plus lâche

La composition, strictement parlant, implique que le tout *contrôle le cycle de vie* de ses parties — les parties n'ont pas d'existence indépendante (un paragraphe fait partie d'exactement un document). Une relation plus lâche où les parties peuvent exister indépendamment (une université *a* des départements, mais les départements et les professeurs survivent à toute configuration unique) s'appelle **aggregation**. La distinction est subtile ; en pratique, les deux se modélisent de la même façon en Ruby — via des relations has-a et de la délégation.

## Choisir entre inheritance et composition

C'est le cœur du chapitre. La règle directrice de Metz :

> Utilisez l'**inheritance** pour les relations *is-a* ; utilisez la **composition** pour les relations *has-a*.

Chaque approche a de vrais coûts et avantages.

### Avantages et coûts de l'inheritance

Une inheritance bien conçue vous donne du code qui est :

- **Reasonable** — un petit changement dans la superclasse produit de grands changements corrects dans les sous-classes (via le template method pattern).
- **Usable** — les nouvelles sous-classes ne nécessitent que leurs différences spécialisées.
- **Exemplary** — le pattern invite à ajouter correctement de nouvelles sous-classes.

Mais l'inheritance est un mauvais choix quand :

- La hiérarchie est fausse (vous êtes forcé de surcharger des méthodes pour *annuler* un comportement), ou
- Vous pourriez être tenté de traverser la hiérarchie pour un comportement qui n'appartient pas à votre branche.

La grande faiblesse : le coût d'avoir *tort* est élevé, et l'inheritance est un engagement. Elle convient le mieux quand vous modélisez des objets qui partagent clairement une relation stable du général au spécifique.

### Avantages et coûts de la composition

Les objets composés tendent à être :

- **Transparent** et faciles à raisonner — de petits objets avec des responsabilités claires et des interfaces simples et bien définies.
- **Flexible** — vous pouvez remplacer une partie par une autre qui joue le même role, et ajouter un nouveau comportement en ajoutant de nouveaux objets.

Les coûts : un tout composé repose sur de nombreux petits objets coopérant par le passage de messages, donc la *combinaison* des parties peut être moins évidente qu'une seule hiérarchie. La composition excelle pour le tout « has-a », mais elle n'arrange pas automatiquement le partage de code entre les parties — c'est le rôle des modules et de l'inheritance.

## Choisir les relations : résumé des règles

Le chapitre se conclut avec des conseils pragmatiques pour choisir une technique :

- **Utilisez l'inheritance pour les relations is-a.** Quand les objets sont véritablement une forme spécialisée d'une chose plus générale, et que la hiérarchie est peu profonde et stable, l'inheritance classique en vaut la peine.
- **Utilisez les duck types (et les modules) pour les relations behaves-like-a.** Quand des objets autrement sans lien ont besoin de jouer un role commun, définissez le role comme un duck type et, s'il y a du code partagé, mettez-le dans un module.
- **Utilisez la composition pour les relations has-a.** Quand un objet est fait de parties, ou en a beaucoup d'un même type, donnez-lui ces parties et déléguez-leur. C'est souvent le choix par défaut le plus sûr.

Le biais général de Metz : **privilégiez la composition** quand vous hésitez. Cela garde les objets petits et flexibles, et le coût d'une mauvaise décision de composition est bien inférieur au coût d'une mauvaise décision d'inheritance. L'inheritance et les modules sont puissants mais rigides ; ne les utilisez que lorsque la relation le justifie vraiment.

## Points clés à retenir

1. **La composition construit un tout à partir de parties via des relations has-a et de la délégation** — les objets *ont* d'autres objets plutôt que d'*être* eux.
2. **Reconstruire le vélo avec la composition** transforme une hiérarchie rigide en petits objets interchangeables : `Bicycle` has a `Parts`, qui est une collection de `Part`s.
3. **Utilisez une factory** pour encapsuler la connaissance de la façon d'assembler des objets composés valides à partir de données de configuration.
4. **Dépendez du duck type de la partie**, pas de sa classe — ainsi un `Part` peut même devenir un simple `Struct` sans rien casser.
5. **L'inheritance est pour is-a, les modules/duck types sont pour behaves-like-a, la composition est pour has-a.**
6. **L'inheritance a un coût élevé quand vous avez tort** ; la composition garde les choses flexibles et transparentes, donc **privilégiez la composition** sauf si une vraie relation is-a justifie l'inheritance.

---

> 🌐 *Traduit par Claude*
