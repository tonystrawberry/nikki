---
title: "POODR Chapitre 5 : Réduire les coûts avec le duck typing"
date: "2026-07-15"
excerpt: "Des interfaces inter-classes définies par le comportement, et non par la classe — reconnaître les canards cachés derrière les vérifications case-sur-classe et responds_to?, et faire confiance aux objets par ce qu'ils font."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "duck-typing", "polymorphism", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 5
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Le chapitre 4 portait sur l'interface d'une seule classe. Le chapitre 5 porte sur les interfaces qui s'étendent *à travers* les classes — des interfaces définies non pas par la classe à laquelle appartient un objet, mais par les messages auxquels il répond. Ce sont les **duck types**, et ils constituent l'un des outils les plus puissants pour réduire le coût du changement dans un langage à typage dynamique comme Ruby.

## Ce qu'est le duck typing

« Si ça marche comme un canard et que ça cancane comme un canard, alors c'est un canard. » En Ruby, le type d'un objet est déterminé par ce qu'il *fait*, et non par sa classe. Un duck type est une **interface publique qui n'est liée à aucune classe spécifique** — n'importe quel objet qui implémente les messages attendus peut jouer le rôle, quelle que soit sa classe réelle.

Comme Ruby ne vérifie pas les types à la compilation, vous êtes libre de concevoir les objets autour des *messages auxquels ils répondent*. Lorsque vous voyez un ensemble d'objets qui répondent tous au même message, vous avez trouvé un duck type — un rôle que de nombreuses classes peuvent jouer. Dépendre de ce rôle, plutôt que de classes concrètes, réduit considérablement le couplage.

## Reconnaître les canards cachés

Le signal le plus clair qu'un duck type *manque* est du code qui aiguille selon la classe. Metz nomme plusieurs schémas à surveiller :

### Les instructions `case` qui aiguillent selon la classe

```ruby
class Trip
  attr_reader :bicycles, :customers, :vehicle

  def prepare(preparers)
    preparers.each do |preparer|
      case preparer
      when Mechanic
        preparer.prepare_bicycles(bicycles)
      when TripCoordinator
        preparer.buy_food(customers)
      when Driver
        preparer.gas_up(vehicle)
        preparer.fill_water_tank(vehicle)
      end
    end
  end
end
```

Ce code demande « quelle classe es-tu ? » puis décide quel message envoyer. Chaque nouveau préparateur impose une clause `when` supplémentaire. C'est rigide et voué à grandir.

### `kind_of?` et `is_a?`

Vérifier `preparer.kind_of?(Mechanic)` pose le même problème sous un autre déguisement — cela couple l'appelant à des classes concrètes.

### `responds_to?`

```ruby
if preparer.responds_to?(:prepare_bicycles)
  # ...
elsif preparer.responds_to?(:buy_food)
```

Cela paraît plus « canard » parce que cela vérifie un comportement, mais cela énumère toujours le comportement de classes spécifiques et les contrôle depuis l'extérieur. C'est moins couplé que la vérification de classe, mais cela en sait encore trop.

Ces trois schémas partagent une cause profonde : l'émetteur en sait trop sur les classes spécifiques de ses collaborateurs, et il dicte le comportement au lieu de faire confiance aux objets.

## Trouver le canard et lui faire confiance

La solution consiste à reconnaître le rôle sous-jacent. Tous les préparateurs partagent une abstraction : chacun peut **préparer un voyage**. Définissez un duck type — un rôle `Preparer` avec un seul message, `prepare_trip` — et laissez chaque classe l'implémenter à sa manière :

```ruby
class Trip
  attr_reader :bicycles, :customers, :vehicle

  def prepare(preparers)
    preparers.each { |preparer| preparer.prepare_trip(self) }
  end
end

class Mechanic
  def prepare_trip(trip)
    trip.bicycles.each { |bicycle| prepare_bicycle(bicycle) }
  end
end

class TripCoordinator
  def prepare_trip(trip)
    buy_food(trip.customers)
  end
end

class Driver
  def prepare_trip(trip)
    vehicle = trip.vehicle
    gas_up(vehicle)
    fill_water_tank(vehicle)
  end
end
```

L'instruction `case` a disparu. `Trip` dépend désormais du duck type abstrait `Preparer`, et non de `Mechanic`, `Driver` ou `TripCoordinator`. Ajouter un nouveau type de préparateur ne demande *aucune* modification à `Trip` — il suffit qu'il réponde à `prepare_trip`. C'est le **polymorphism** : de nombreux objets répondant au même message, chacun à sa manière.

## Les compromis du typage dynamique

Le duck typing n'est possible que parce que Ruby est à typage dynamique. Metz aborde directement l'éternel débat entre typage statique et dynamique :

- Le **typage statique** promet que le compilateur détecte les erreurs de type et documente le code. Mais il sacrifie la flexibilité qui rend les canards possibles.
- Le **typage dynamique** vous permet d'écrire du code concis et flexible et de faire de la métaprogrammation librement, au prix des garanties à la compilation.

La posture pragmatique : puisque Ruby *est* à typage dynamique, assumez-le. Faites confiance au fait que vos objets répondent aux messages que vous envoyez. Cette confiance — dépendre d'interfaces abstraites plutôt que de classes concrètes — est ce qui rend le code flexible et peu coûteux à modifier.

## Points clés à retenir

1. **Les duck types sont des interfaces publiques indépendantes de toute classe spécifique** — le type d'un objet est défini par ce qu'il fait, pas par ce qu'il est.
2. **Les vérifications case-sur-classe, `kind_of?`/`is_a?` et `responds_to?` sont des indices** qu'un duck type se cache, attendant d'être nommé.
3. **Remplacez les vérifications de classe par un rôle partagé** : définissez l'interface abstraite et laissez chaque classe l'implémenter de manière polymorphe.
4. **Dépendre d'un duck type vous découple des classes concrètes**, de sorte que de nouveaux implémenteurs peuvent être ajoutés sans modifier le code existant.
5. **Le duck typing repose sur la confiance** — envoyez le message et faites confiance au récepteur pour y répondre de manière appropriée.
6. **Assumez le typage dynamique de Ruby** plutôt que de le combattre ; la flexibilité qu'il offre est une fonctionnalité, pas un défaut.

---

> 🌐 *Traduit par Claude*
