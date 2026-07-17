---
title: "POODR Chapitre 9 : Concevoir des tests rentables"
date: "2026-07-17"
excerpt: "Écrire des tests qui se paient d'eux-mêmes — quoi tester, quand tester, comment tester les messages entrants et sortants, et garder la suite de tests peu coûteuse à maintenir à mesure que la conception évolue."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "testing", "tdd", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 9
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## Vue d'ensemble

Le chapitre 9 clôt le livre en traitant les tests comme un problème de conception à part entière. Les tests ne sont pas gratuits — ils coûtent du temps à écrire, lire et modifier. Une bonne suite **prouve** que votre application fonctionne *et* que votre conception est solide, tout en restant peu coûteuse à maintenir lorsque le code évolue. L'objectif est des **tests rentables** : un maximum de confiance pour un coût de maintenance minimal.

## Intention des tests

Les tests remplissent plusieurs objectifs qui se chevauchent :

- **Trouver les bugs** — attraper les régressions avant les utilisateurs.
- **Documenter la conception** — un test bien écrit est un exemple exécutable de la manière dont un objet est censé être utilisé.
- **Reporter les décisions de conception** — avec un filet de sécurité, vous pouvez refactorer vers une meilleure conception sans crainte.
- **Supporter le changement** — la suite existe pour que vous puissiez modifier l'application ; si modifier un test est plus difficile que modifier le code, la suite est devenue un passif.

> Le but des tests n'est pas d'écrire le plus de tests possible — c'est d'écrire les *bons* tests.

## Savoir quoi tester

Testez l'**interface publique** de chaque objet. Les messages entrants qui composent le contrat de l'objet sont ceux qui comptent. Évitez de tester :

- **Les méthodes privées** — ce sont des détails d'implémentation. Les tester couple la suite à la manière *dont* l'objet fonctionne, de sorte que chaque refactorisation interne casse des tests qui ne prouvent rien de plus sur le contrat public.
- **Les messages entrants qui ne changent pas l'état et ne renvoient rien d'utile** — en général, pas la peine de les faire figurer dans des assertions.
- **Le même comportement deux fois** à travers les couches de la hiérarchie ou à travers des rôles qui se chevauchent — placez l'assertion là où le comportement est défini, une seule fois.

Une règle empirique utile : **testez tout ce qui pourrait casser, mais une seule fois, et uniquement via l'interface publique.**

## Savoir quand tester

Écrivez les tests aussi près que possible du moment où vous écrivez le code — idéalement en premier (TDD) ou immédiatement après. Les tests écrits longtemps après coup sont plus difficiles à bien faire (vous ne vous souvenez plus de l'interface prévue) et ont tendance à verrouiller une conception accidentelle.

Aussi : **écrivez des tests pour le code que vous vous apprêtez à modifier.** Une zone non testée que vous devez toucher est un endroit où la suite devrait d'abord s'étoffer, afin que le changement puisse être vérifié.

## Savoir comment tester

### Messages entrants

Pour chaque méthode publique qui renvoie une valeur (une **query**), assertez la valeur de retour. Pour chaque méthode publique qui change l'état (une **command**), assertez l'état résultant.

```ruby
# Incoming query — assert the result
assert_equal 4.727, gear.gear_inches

# Incoming command — assert the side effect / resulting state
bicycle.shift
assert_equal :high, bicycle.gear
```

Ces tests prouvent que l'objet respecte son contrat avec ses *expéditeurs*.

### Messages sortants

Les messages sortants se répartissent en deux catégories :

1. **Queries envoyées à d'autres** (vous demandez une valeur et l'utilisez) — ne **pas** assertez que le message a été envoyé. La valeur de retour est déjà exercée via le test de message entrant. Assertez l'envoi vous couple aux détails privés d'un collaborateur.
2. **Commands envoyées à d'autres** (vous demandez à un autre objet de faire quelque chose, et l'effet de bord compte) — **assertez** que le message a été envoyé, typiquement avec un mock. Si la command ne se déclenche jamais, le reste du monde est faux même si cet objet semble correct isolément.

```ruby
# Outgoing command — prove the message is sent
mock_wheel = MiniTest::Mock.new
mock_wheel.expect(:rotate, true)
gear = Gear.new(chainring: 52, cog: 11, wheel: mock_wheel)
gear.rotate_wheel
mock_wheel.verify
```

### Tester les duck types

Lorsque plusieurs classes jouent un rôle (un duck type), écrivez un **test partagé** pour ce rôle et incluez-le dans le test de chaque acteur. Ainsi, l'interface du rôle est documentée une seule fois, et chaque acteur est prouvé conforme.

### Tester le code hérité

- Testez la **superclasse abstraite** via une sous-classe concrète créée uniquement pour le test (ou via chaque vraie sous-classe).
- Dans chaque sous-classe, testez uniquement les **spécialisations** — les hooks et surcharges qui diffèrent des valeurs par défaut héritées. Ne retestez pas le comportement hérité déjà couvert par la suite de la superclasse.

## Utiliser les test doubles avec discernement

Les **stub** renvoient des valeurs préfabriquées pour isoler l'objet sous test. Les **mock** stubent et assertent qu'un message spécifique a été envoyé (avec des arguments spécifiques). Un usage excessif des mock crée des tests fragiles qui cassent dès que l'interface d'un collaborateur change — même lorsque le comportement reste correct.

Préférez :

- Tester avec de **vrais collaborateurs simples** lorsqu'ils sont peu coûteux et stables.
- Les mock uniquement pour les **commands sortantes** dont vous devez vérifier les effets de bord.
- Les tests de rôle (exemples partagés) pour que chaque acteur d'un duck type soit vérifié de la même manière.

## Garder les tests peu coûteux à modifier

Les mêmes règles de conception des chapitres précédents s'appliquent à la suite :

- **Dépendre des interfaces, pas des implémentations** — assertez les résultats et les contrats publics, pas les appels de méthodes privées ou les structures de données internes.
- **Éviter la duplication** — tests de rôle partagés, factories/fixtures pour la mise en place des objets.
- **Rendre l'intention évidente** — un test en échec doit pointer clairement vers le contrat rompu.

Une suite qui reflète une application bien conçue reste petite, claire et facile à mettre à jour. Une suite qui fouille dans les détails privés devient un autre graphe de dépendances enchevêtré.

## Points clés

1. **Les tests sont un investissement** — optimisez pour la confiance par unité de coût de maintenance, pas pour le pourcentage de couverture seul.
2. **Testez l'interface publique** — queries entrantes (assertez les résultats) et commands entrantes (assertez l'état résultant).
3. **Ne testez pas les méthodes privées** ; ne retestez pas le comportement hérité ou partagé dans chaque sous-classe/acteur.
4. **Les queries sortantes n'ont pas besoin d'assertion « a-t-il été envoyé ? »** ; **les commands sortantes oui** (utilisez des mock).
5. **Documentez les rôles duck type avec des tests partagés** que chaque acteur inclut.
6. **Écrivez les tests près du code** (TDD ou immédiatement après), surtout avant de modifier des zones non testées.
7. **Une bonne suite supporte le changement** — si les tests sont plus difficiles à modifier que le code, repensez les tests.

---

*C'est le dernier chapitre de Practical Object-Oriented Design in Ruby. Le livre dans son ensemble est un guide pratique pour organiser les objets de sorte que le changement reste peu coûteux — et le chapitre 9 étend cette même discipline aux tests qui protègent la conception.*

---

> 🌐 *Traduit par Claude*
