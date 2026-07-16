---
title: "POODR Chapitre 7 : Partager le comportement d'un rôle avec les modules"
date: "2026-07-15"
excerpt: "Partager du comportement entre des classes sans lien de parenté grâce aux modules Ruby — reconnaître les rôles, écrire du code de module héritable, comprendre la recherche de méthode et les règles d'un héritage bien conçu (Liskov, hooks, hiérarchies peu profondes)."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "modules", "roles", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 7
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Le chapitre 6 utilisait l'héritage classique pour partager du comportement entre des classes qui sont des variantes d'une même *chose* (une `RoadBike` **est un** `Bicycle`). Mais il arrive que plusieurs objets par ailleurs sans lien de parenté aient besoin de jouer le même **rôle** — ils doivent tous *faire* la même chose sans *être* la même chose. Le chapitre 7 traite du partage de ce comportement de rôle avec les **modules Ruby** (mixins), puis énonce les règles qui rendent digne de confiance *tout* héritage — classique ou basé sur les modules.

## Comprendre les rôles

Certains problèmes exigent que des objets sans lien de parenté répondent au même message. Cette responsabilité partagée est un **rôle**. Un duck type (chapitre 5) est un rôle défini par une interface ; ce chapitre porte sur les rôles qui s'accompagnent aussi de *code partagé*.

Une mise en garde d'emblée : **utiliser un rôle crée des dépendances**, et ces dépendances augmentent le risque de votre conception. Les rôles sont puissants mais doivent être utilisés délibérément, pas par réflexe.

## Trouver les rôles

L'exemple : un planificateur doit savoir si une cible (un `Bicycle`, un `Mechanic`, un `Vehicle`) est disponible durant une plage de temps proposée, en respectant un « délai d'attente » (lead time) entre les réservations. Toute chose planifiable doit répondre à `schedulable?`, et elles partagent toutes la même logique de délai — mais les vélos, les mécaniciens et les véhicules sont par ailleurs sans lien de parenté.

C'est un **rôle `Schedulable`**. L'interface plus son comportement partagé appartiennent à un module que n'importe quelle classe peut inclure.

## Écrire le code qui utilise un rôle — les modules

En Ruby, un **module** contient un ensemble nommé de méthodes qui peuvent être mixées dans n'importe quelle classe avec `include`. Une fois inclus, les méthodes du module deviennent disponibles pour les instances de cette classe *comme si elles y étaient définies* — l'objet acquiert le comportement.

```ruby
module Schedulable
  attr_writer :schedule

  def schedule
    @schedule ||= ::Schedule.new
  end

  def schedulable?(start_date, end_date)
    !scheduled?(start_date - lead_days, end_date)
  end

  def scheduled?(start_date, end_date)
    schedule.scheduled?(self, start_date, end_date)
  end

  # includers may override; template-method style default
  def lead_days
    0
  end
end

class Bicycle
  include Schedulable

  def lead_days
    1
  end
end
```

`Schedulable` définit l'*algorithme* (`schedulable?` → `scheduled?`) et expose un **hook** (`lead_days`) avec une valeur par défaut sensée. Chaque includer ne spécialise que ce qui diffère. C'est exactement le patron template method du chapitre 6, désormais appliqué via un module plutôt qu'une superclasse.

## La recherche de méthode et les antipatterns

Lorsqu'un objet reçoit un message, Ruby cherche la méthode correspondante dans un ordre précis :

1. la **classe** propre de l'objet,
2. tout **module** que cette classe a inclus (le dernier inclus est cherché en premier),
3. la **superclasse**,
4. les modules inclus de la superclasse,
5. …en remontant la chaîne jusqu'à `Object`, `Kernel` et `BasicObject`.

Parce que les modules inclus sont insérés dans ce chemin de recherche, mixer un module est une forme d'héritage — les mêmes règles et les mêmes risques s'appliquent.

Deux **antipatterns** signalent que vous devriez recourir à un rôle ou à une abstraction :

- Un objet qui utilise une **variable portant un nom comme `type` ou `category`** pour décider quel message envoyer à `self` → les classes partagent probablement un rôle ; envisagez l'héritage classique pour la partie *is-a* et les modules pour la partie *behaves-as*.
- Un émetteur de message qui **vérifie la classe du receveur** pour décider quel message envoyer → il vous manque un duck type ; les receveurs partagent un rôle, et l'interface de ce rôle (et éventuellement du code partagé) appartient à un module.

## Écrire du code héritable

La dernière section donne des règles qui s'appliquent à **tout** héritage, que ce soit via des superclasses ou des modules. Ce sont elles qui rendent une hiérarchie sûre à construire dessus.

### Reconnaître les antipatterns

(comme ci-dessus) — ils vous disent *quand* le partage de code est approprié.

### Insister sur l'abstraction

Tout le code d'une superclasse abstraite ou d'un module doit s'appliquer à **chaque** objet qui en hérite. Ne placez jamais là du code dont seuls *certains* includers ont besoin. Si une sous-classe ou un includer surcharge une méthode pour lever une erreur (« n'implémente pas ceci »), c'est la preuve que l'abstraction est mauvaise — la méthode n'avait pas sa place dans le code partagé.

### Honorer le contrat — le principe de substitution de Liskov

Les sous-classes et les includers doivent être **substituables** à la chose qu'ils spécialisent. Une sous-classe doit honorer la même interface et se comporter d'une manière attendue par les appelants — accepter les mêmes types d'entrées et retourner les mêmes types de sorties. C'est le **Liskov Substitution Principle (LSP)**, le « L » de SOLID. Le violer signifie que les appelants doivent savoir à quel type concret ils ont affaire, ce qui ruine toute la raison d'être de l'abstraction.

### Utiliser le patron template method

Séparez l'abstrait (l'algorithme partagé) du concret (la spécialisation propre à chaque includer) en faisant en sorte que le code partagé envoie des messages que les includers implémentent — avec des valeurs par défaut fournies dans le code partagé.

### Découpler les classes de manière préventive — éviter `super` dans les includers

Autant que possible, évitez d'écrire du code qui oblige les includers/sous-classes à envoyer `super`. Utilisez plutôt des **méthodes hook**, afin que les spécialisations s'insèrent dans l'algorithme sans avoir besoin de le connaître. Ainsi le code partagé garde le contrôle du *quand*, et les includers gardent le contrôle du *quoi*.

### Créer des hiérarchies peu profondes

Les hiérarchies d'héritage profondes et larges sont difficiles à comprendre et coûteuses à modifier — la recherche de méthode parcourt une longue distance, et il est difficile de raisonner sur l'origine du comportement. Préférez des hiérarchies **peu profondes et étroites**. Elles sont plus faciles à appréhender et bien moins risquées à étendre.

## Points clés à retenir

1. **Les modules permettent à des classes sans lien de parenté de partager un rôle** — un comportement commun pour des objets qui *font* la même chose sans *être* la même chose.
2. **Utiliser un rôle introduit des dépendances**, donc appliquez les modules délibérément, pas par défaut.
3. **Inclure un module est une forme d'héritage** — les modules rejoignent le chemin de recherche de méthode, donc toutes les règles de l'héritage s'appliquent aussi à eux.
4. **Appliquez le patron template method dans les modules** : définissez l'algorithme, exposez des hooks avec des valeurs par défaut sensées, et laissez les includers spécialiser.
5. **Insistez sur l'abstraction** — le code partagé doit s'appliquer à *chaque* includer ; une surcharge qui lève « non implémenté » signifie que l'abstraction est mauvaise.
6. **Honorez le principe de substitution de Liskov** — les includers/sous-classes doivent être substituables à l'abstraction qu'ils étendent.
7. **Évitez de forcer `super`, et gardez les hiérarchies peu profondes et étroites** pour minimiser le couplage et la charge cognitive.

---

> 🌐 *Traduit par Claude*
