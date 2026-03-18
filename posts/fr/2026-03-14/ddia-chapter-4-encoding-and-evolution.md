---
title: "DDIA Chapitre 4 : Encodage et évolution"
date: "2026-03-14"
excerpt: "Résumé du chapitre de Kleppmann sur les formats d'encodage des données, l'évolution des schémas et la compatibilité dans les systèmes data-intensive."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "encoding", "schema", "evolution"]
coverImage: ""
collection: "ddia"
collectionOrder: 4
collectionTitle: "Designing Data-Intensive Applications"
---

## Vue d'ensemble

Le chapitre 4 de *Designing Data-Intensive Applications* porte sur la façon dont les données sont encodées (sérialisées) et sur l'évolution des systèmes dans le temps sans rupture. Les applications changent en permanence ; la capacité à déployer du nouveau code et à faire évoluer les schémas sans interruption ni perte de données dépend des choix d'encodage et des garanties de compatibilité.

## Formats spécifiques au langage et formats textuels

- **Spécifiques au langage** (sérialisation Java, pickle Python) : pratiques mais vous lient à un seul langage, posent des problèmes de sécurité et de versionnement, et conviennent mal au stockage persistant ou aux échanges entre services.
- **JSON, XML, CSV** : lisibles et largement supportés, mais typage faible (nombres vs chaînes), pas de schéma, et verbosité. JSON est le standard pour les API ; XML est plus lourd ; CSV est le plus plat et fragile pour les données imbriquées.

**Exemple — mêmes données en JSON vs CSV :** JSON gère l'imbrication et les types ; CSV aplatit et perd la structure.

```json
{
  "user_id": 42,
  "name": "Alice",
  "preferences": { "theme": "dark", "notifications": true }
}
```

```csv
user_id,name,preferences.theme,preferences.notifications
42,Alice,dark,true
```

Les noms de colonnes CSV deviennent ambigus avec l'imbrication ; les nombres peuvent être confondus avec des chaînes ; pas de standard pour null/vide.

## Encodage binaire et formats à base de schéma

Pour un débit élevé ou de gros volumes, les encodages binaires réduisent la taille et le temps de parsing. Les formats à base de schéma donnent structure et sémantique d'évolution :

- **Protocol Buffers (Protobuf)** et **Thrift** : exigent un schéma ; génèrent du code ; encodent par numéro de champ (tag). On peut ajouter des champs ; les anciens lecteurs ignorent les tags inconnus. Renommer dans le schéma ne change que le code généré — les numéros de tag sur le fil restent les mêmes, donc on ne peut pas vraiment « renommer » un champ pour les données existantes.
- **Avro** : format binaire à base de schéma avec deux schémas en jeu — celui du writer et celui du reader. Le schéma est souvent stocké avec les données (ex. en en-tête de fichier ou dans un registre). Pas de tags de champs ; l'encodage est positionnel, donc l'ordre des champs et les règles de compatibilité comptent. Bien adapté aux pipelines de logs/événements et aux data lakes en évolution.

Idée commune : le **schéma** définit le contrat ; l'encodage est compact et prévisible. L'évolution se fait par des règles de compatibilité (ajouter des champs optionnels, ne pas supprimer de champs requis, etc.).

### Exemple Protocol Buffers

Le schéma définit les **tags de champs** (1, 2, 3…). Ce sont ces numéros qui sont encodés sur le fil — pas les noms de champs. Ajouter un nouveau champ optionnel avec un nouveau tag est rétrocompatible et compatible vers l'avant.

```protobuf
// person.proto (v1)
message Person {
  required string name = 1;
  required int64 id = 2;
  optional string email = 3;
}

// Later (v2): add optional field — old readers ignore tag 4
message Person {
  required string name = 1;
  required int64 id = 2;
  optional string email = 3;
  optional string phone = 4;   // NEW: new code can set it, old code ignores
}
```

Ne jamais réutiliser un numéro de tag pour un autre champ ; d'anciennes données peuvent encore contenir ce tag. « Renommer » un champ dans le schéma ne change que le code généré — le format sur le fil reste le même.

### Exemple Avro

Avro utilise un encodage **positionnel** et des schémas writer/reader explicites. Le schéma du reader sert à résoudre les différences (ex. « champ ajouté côté writer, absent côté reader » → ignorer ; « champ ajouté côté reader, absent côté writer » → utiliser la valeur par défaut).

```json
// User record schema (writer)
{
  "type": "record",
  "name": "User",
  "fields": [
    { "name": "id", "type": "long" },
    { "name": "username", "type": "string" },
    { "name": "email", "type": ["null", "string"], "default": null }
  ]
}
```

L'encodage binaire est compact : pas de noms de champs, seulement les valeurs dans l'ordre. Pour ajouter un champ, l'ajouter avec une valeur par défaut pour que les anciennes données restent lisibles (le reader fournit la valeur par défaut quand le writer n'avait pas le champ).

## Évolution du schéma et compatibilité

- **Compatibilité ascendante (backward)** : le nouveau code peut lire les données écrites par l'ancien (ex. nouveau serveur lit d'anciens messages). En pratique : « n'ajouter que des champs optionnels » ou « ne pas supprimer de champs ».
- **Compatibilité descendante (forward)** : l'ancien code peut lire les données écrites par le nouveau (ex. ancien client lit la réponse du nouveau serveur). En pratique : « ignorer les champs inconnus » et « ne pas exiger de champs qui n'existaient pas avant ».

Avec Protobuf/Thrift/Avro on obtient les deux en suivant des conventions : ajouter des champs optionnels, utiliser des valeurs par défaut, et ne jamais supprimer ni réaffecter de champs requis sans déploiement en plusieurs phases.

**Compatibilité dans le temps :**

```
Compatibilité ascendante (nouveau lecteur, anciennes données) :
  ANCIEN WRITER ──► [anciens octets] ──► NOUVEAU READER  ✓  (nouveau code comprend l'ancien format)

Compatibilité descendante (ancien lecteur, nouvelles données) :
  NOUVEAU WRITER ──► [nouveaux octets] ──► ANCIEN READER  ✓  (ancien code ignore les champs inconnus)
```

**Ce qui casse la compatibilité :**

| Modification | Ascendante ? | Descendante ? |
|--------------|--------------|---------------|
| Ajouter un champ optionnel | ✓ | ✓ |
| Supprimer un champ requis | ✗ (nouveau reader l'attend) | ✓ (ancien reader n'en avait pas besoin) |
| Ajouter un champ requis | ✓ | ✗ (ancien reader ne peut pas le fournir) |
| Renommer un champ (même tag/position) | ✓ | ✓ (noms pas sur le fil) |
| Changer le type d'un champ | Souvent ✗ | Souvent ✗ |

## Modes de flux de données

L'encodage et l'évolution se jouent différemment selon le contexte :

- **Bases de données** : writer = processus qui écrit une ligne, reader = processus qui la lit plus tard (souvent la même app, éventuellement une version plus récente). Les migrations de schéma (ajout de colonne, backfill) sont une forme d'évolution ; garder la compatibilité ascendante/descendante évite les déploiements big-bang.
- **RPC et REST** : client et serveur peuvent être en versions différentes. La compatibilité ascendante (nouveau serveur, ancien client) et descendante (ancien serveur, nouveau client) comptent toutes deux ; des API versionnées ou une évolution de schéma soignée limitent les ruptures.
- **Message-passing / asynchrone** : producteurs et consommateurs sont découplés ; les messages peuvent être rejoués ou lus par de nouveaux consommateurs des mois plus tard. Une compatibilité forte et une évolution de schéma claire (ex. Avro avec un schema registry) sont critiques.

**Flux de données dans chaque mode :**

```
┌─────────────────────────────────────────────────────────────────┐
│ BASE DE DONNÉES                                                   │
│  App v1 écrit une ligne  ──►  [stockage]  ──►  App v2 lit la ligne│
│  (même processus dans le temps, ou nouveau déploiement lisant     │
│   d'anciennes lignes)                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RPC / REST                                                       │
│  Client (ancien ou nouveau)  ◄──►  Serveur (ancien ou nouveau)  │
│  Les deux sens doivent tolérer champs inconnus / champs optionnels│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MESSAGE PASSING (ex. Kafka, file d'attente)                       │
│  Producer v2  ──►  [log]  ──►  Consumer v1 (ou nouveau Consumer v3)│
│  Les messages peuvent être lus des mois plus tard ; schema       │
│  registry + Avro permettent aux readers de résoudre writer       │
│  schema vs reader schema                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Points clés

- Utiliser des formats binaires **à base de schéma** (Protobuf, Avro, Thrift) quand la performance, la clarté et une évolution sûre comptent ; éviter la sérialisation opaque ou spécifique au langage pour les données persistantes ou inter-services.
- Concevoir dès le départ pour la **compatibilité ascendante et descendante** : champs optionnels, pas de suppression de champs requis, et comportement « ignorer les champs inconnus ».
- **Avro** convient bien aux flux d'événements et aux data lakes où les schémas writer et reader peuvent différer et où le schéma est stocké avec ou à côté des données.
- **Protobuf et Thrift** sont adaptés au RPC et aux API service-à-service quand on maîtrise les deux extrémités et que l'on veut la génération de code et un versionnement clair.
- La même logique de compatibilité s'applique aux **bases de données** : les changements de schéma (nouvelles colonnes, nouvelles tables) doivent être compatibles ascendants et descendants quand on ne peut pas se permettre d'arrêt ou de réécritures massives.

---
*Traduit par Claude*
