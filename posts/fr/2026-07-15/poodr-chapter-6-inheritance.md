---
title: "POODR Chapitre 6 : Acquérir un comportement par l'héritage"
date: "2026-07-15"
excerpt: "L'héritage classique bien fait — reconnaître où il s'applique, refactoriser des classes concrètes en une superclasse abstraite, et utiliser le patron méthode gabarit (template method) avec des hooks plutôt que super."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "inheritance", "template-method", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 6
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Le chapitre 6 présente l'**héritage classique** — le partage de comportement entre classes via une hiérarchie superclasse/sous-classe. L'héritage est puissant mais facile à mal utiliser. Le chapitre parcourt tout le cheminement : reconnaître quand l'héritage est le bon outil, découvrir l'abstraction, la déplacer dans une superclasse abstraite, et enfin découpler la hiérarchie pour que les sous-classes n'aient pas à savoir comment elles coopèrent avec leur parent.

## Comprendre l'héritage classique

L'héritage est, fondamentalement, un mécanisme de **délégation automatique de messages**. Lorsqu'un objet reçoit un message qu'il ne comprend pas, il transmet le message vers le haut de la chaîne d'héritage. Définir une hiérarchie revient simplement à disposer les classes de sorte que les messages non traités voyagent dans une direction sensée.

« Classique » désigne ici l'héritage basé sur les *classes* (par opposition à l'héritage prototypal ou basé sur les modules). Une sous-classe **est une** spécialisation de sa superclasse — elle devrait être tout ce qu'est la superclasse, et plus encore.

## Reconnaître où utiliser l'héritage

Le chapitre commence avec une seule classe `Bicycle` qui a grossi pour gérer plusieurs types de vélos. Elle est truffée d'un défaut : des attributs et des comportements qui s'appliquent à *certains* vélos mais pas à d'autres, contrôlés par la vérification d'une variable `style`.

```ruby
class Bicycle
  attr_reader :style, :size, :tape_color, :front_shock, :rear_shock

  def spares
    if style == :road
      { chain: '10-speed', tire_size: '23', tape_color: tape_color }
    else
      { chain: '10-speed', tire_size: '2.1', rear_shock: rear_shock }
    end
  end
end
```

Ce `if style == ...` est le signal révélateur. **Une variable contenant le nom d'un « type » ou d'une « catégorie », utilisée pour décider quel message envoyer, est le signal classique que l'héritage pourrait aider.** Cela signifie qu'une classe essaie en réalité d'en être deux.

## Mal appliquer l'héritage

Un premier réflexe tentant consiste à faire de `MountainBike` une sous-classe de la classe concrète `Bicycle` existante. Cela échoue, car `Bicycle` est une **classe concrète qui mêle le comportement général des vélos aux spécificités des vélos de route**. `MountainBike` hérite alors d'un comportement de vélo de route dont il ne veut pas (comme `tape_color`) et doit le contourner. Des sous-classes qui surchargent des méthodes pour *annuler* un comportement hérité sont le signe que la hiérarchie est mauvaise.

La leçon : **on ne peut pas créer une bonne sous-classe d'une classe déjà concrète et spécifique.** La superclasse doit être abstraite.

## Trouver l'abstraction

Deux conditions doivent être réunies pour que l'héritage ait du sens :

1. Les objets que vous modélisez entretiennent une véritable relation **est-un / général–spécifique**.
2. Vous pouvez utiliser la bonne **technique de code** pour construire la hiérarchie.

La stratégie consiste à **tout pousser vers le bas** puis à **remonter l'abstraction** :

1. Créer une superclasse abstraite `Bicycle` vide.
2. Faire hériter `RoadBike` et `MountainBike` de celle-ci, et déplacer d'abord *tout* le comportement vers le bas, dans les sous-classes concrètes. (C'est plus sûr que d'essayer de deviner l'abstraction à l'avance.)
3. Ensuite **promouvoir** le comportement véritablement partagé et général vers le haut, dans `Bicycle`, une pièce à la fois.

Promouvoir *vers le haut* est plus sûr que rétrograder *vers le bas* : si vous laissez accidentellement quelque chose de concret dans la classe abstraite, toutes les sous-classes en souffrent ; si vous promouvez trop peu, seule la sous-classe concernée casse et c'est facile à repérer.

```ruby
class Bicycle
  attr_reader :size          # shared by all bikes -> promoted up

  def initialize(args = {})
    @size = args[:size]
  end
end

class RoadBike < Bicycle
  attr_reader :tape_color    # road-specific -> stays down

  def initialize(args)
    @tape_color = args[:tape_color]
    super(args)
  end
end
```

## Le patron méthode gabarit (template method pattern)

La superclasse abstraite définit l'*algorithme* et fait appel à des méthodes que les sous-classes remplissent. C'est le **patron méthode gabarit (template method pattern)** : la superclasse envoie un message, et chaque sous-classe fournit sa propre version spécialisée.

```ruby
class Bicycle
  def initialize(args = {})
    @size = args[:size]
    @chain = args[:chain] || default_chain
    @tire_size = args[:tire_size] || default_tire_size
  end

  def default_chain            # common default
    '10-speed'
  end
end

class RoadBike < Bicycle
  def default_tire_size        # subclass supplies the specialization
    '23'
  end
end
```

**Fournissez toujours une valeur par défaut sensée ou levez explicitement une erreur** pour toute méthode gabarit. Si `Bicycle` appelle `default_tire_size` mais ne le définit pas, un futur auteur de sous-classe qui oublie de l'implémenter obtiendra un `NameError` déroutant. Mieux vaut échouer bruyamment avec un message utile :

```ruby
def default_tire_size
  raise NotImplementedError,
        "#{self.class} should have implemented ..."
end
```

## Gérer le couplage entre superclasse et sous-classe

La hiérarchie naïve oblige les méthodes `initialize` et `spares` de chaque sous-classe à appeler `super`. C'est fragile : cela couple la sous-classe à l'*algorithme* de la superclasse. Si l'auteur d'une nouvelle sous-classe oublie d'envoyer `super`, l'objet casse de manière subtile. C'est le piège « **les sous-classes doivent savoir comment coopérer** ».

Le correctif est le **patron méthode hook (hook method pattern)**. La superclasse définit l'algorithme complet et envoie des messages *hook* que les sous-classes peuvent facultativement surcharger. Les sous-classes fournissent des spécialisations sans jamais appeler `super` :

```ruby
class Bicycle
  def initialize(args = {})
    @size = args[:size]
    @chain = args[:chain] || default_chain
    @tire_size = args[:tire_size] || default_tire_size
    post_initialize(args)      # hook: subclass contributes here
  end

  def post_initialize(args)
    nil                         # default: do nothing
  end

  def spares
    { tire_size: tire_size, chain: chain }.merge(local_spares)
  end

  def local_spares             # hook for subclass-specific spares
    {}
  end
end

class RoadBike < Bicycle
  def post_initialize(args)    # no super needed
    @tape_color = args[:tape_color]
  end

  def local_spares
    { tape_color: tape_color }
  end
end
```

Désormais, la superclasse possède le *quand* (l'algorithme), et les sous-classes ne possèdent que le *quoi* (leur spécialisation). Les sous-classes n'ont plus besoin de connaître l'algorithme abstrait — elles se contentent de remplir les blancs. Cela réduit considérablement le couplage et rend la hiérarchie facile à étendre.

## Points clés à retenir

1. **L'héritage est une délégation automatique de messages** vers le haut d'une hiérarchie de classes ; une sous-classe doit être une véritable spécialisation (est-un) de sa superclasse.
2. **Une variable de « type » qui pilote des conditionnelles** (`if style == ...`) est le signal que l'héritage pourrait aider.
3. **Ne dérivez jamais d'une classe concrète** — la superclasse doit être abstraite, ne contenant que le comportement commun à toutes les sous-classes.
4. **Construisez l'abstraction en poussant tout vers le bas et en remontant le comportement partagé** ; promouvoir vers le haut est plus sûr que rétrograder vers le bas.
5. **Utilisez le patron méthode gabarit (template method pattern)** afin que la superclasse définisse l'algorithme et que les sous-classes fournissent les spécialisations — et fournissez toujours des valeurs par défaut ou levez `NotImplementedError`.
6. **Préférez les méthodes hook plutôt que de forcer les sous-classes à appeler `super`**, ainsi les sous-classes n'ont pas à connaître l'algorithme de la superclasse et les deux restent faiblement couplées.

---

> 🌐 *Traduit par Claude*
