---
title: "DDIA Chapitre 2 : Modèles de données et langages de requêtes"
date: "2026-03-12"
excerpt: "Notes sur le chapitre 2 de Designing Data-Intensive Applications — modèle relationnel vs modèle document, langages de requêtes et bases de données orientées graphe."
author: "Tony Duong"
category: "note"
tags: ["ddia", "databases", "data-modeling", "sql", "nosql", "graph-databases"]
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1034&auto=format&fit=crop&ixlib=rb-4.1.0"
collection: "ddia"
collectionOrder: 2
collectionTitle: "Designing Data-Intensive Applications"
---

## Vue d'ensemble

Le chapitre 2 explore la manière dont nous modélisons les données et dont nous les interrogeons. Le choix du modèle de données a un effet profond sur notre façon de penser le problème que nous résolvons. Chaque modèle s'accompagne d'hypothèses sur la façon dont les données seront utilisées, et ces hypothèses rendent certaines opérations faciles et d'autres maladroites.

## Modèle relationnel vs modèle document

Le **modèle relationnel** (SQL) organise les données en tables de lignes. Il a été proposé par Edgar Codd en 1970, est devenu dominant au milieu des années 1980 et reste la norme pour la plupart des applications.

Le **modèle document** (NoSQL) a émergé dans les années 2010, porté par :

- Le besoin d'une plus grande scalabilité (grands ensembles de données, haut débit en écriture)
- La préférence pour les logiciels libres et open source
- Des opérations de requêtes spécialisées mal prises en charge par le modèle relationnel
- La frustration face aux schémas relationnels restrictifs — le désir d'un modèle de données plus dynamique et expressif

### Le décalage objet-relationnel

La plupart du code applicatif utilise des objets ou des structures, mais les tables relationnelles nécessitent une couche de traduction maladroite (parfois appelée **impedance mismatch**). Les ORM aident mais ne masquent pas entièrement les différences.

Un CV est un bon exemple : dans une base de données relationnelle, il faudrait plusieurs tables (formation, expérience professionnelle, coordonnées) jointes à un utilisateur. Dans un modèle document, l'ensemble peut être un seul document JSON — bien plus proche de la façon dont l'application le perçoit.

### Bases relationnelles vs bases document aujourd'hui

| Aspect | Relationnel | Document |
|--------|------------|----------|
| Schéma | Schéma à l'écriture (imposé) | Schéma à la lecture (flexible) |
| Jointures | Naturelles, bien supportées | Faibles, nécessitent souvent des jointures au niveau applicatif |
| Plusieurs-à-un | Facile avec les clés étrangères | Nécessite une dénormalisation ou des jointures applicatives |
| Localité des données | Réparties entre plusieurs tables | Document entier stocké ensemble |
| Idéal pour | Données fortement interconnectées | Documents autonomes, arborescences un-à-plusieurs |

**Convergence** : les bases relationnelles prennent désormais en charge les colonnes JSON/XML ; les bases document ajoutent des fonctionnalités de type jointure. Les modèles deviennent de plus en plus similaires au fil du temps.

## Relations plusieurs-à-un et plusieurs-à-plusieurs

Lorsque vous stockez une valeur en texte brut comme « Greater Seattle Area » au lieu d'un identifiant, vous dupliquez l'information. Utiliser un **identifiant** qui référence un enregistrement canonique (normalisation) offre :

- Une orthographe et un formatage cohérents
- Des mises à jour faciles (modification à un seul endroit)
- La prise en charge de la localisation
- Une meilleure recherche

Cela nécessite des **jointures**. Les bases document n'ont historiquement pas bien pris en charge les jointures, repoussant celles-ci dans le code applicatif — ce qui est plus lent et plus complexe.

À mesure que les applications grandissent, les données tendent à devenir plus interconnectées, et l'absence de support des jointures devient de plus en plus problématique.

## Langages de requêtes pour les données

### Déclaratif vs impératif

- **Impératif** (la plupart des langages de programmation) : vous indiquez à la machine les étapes à exécuter
- **Déclaratif** (SQL, CSS) : vous décrivez le motif du résultat souhaité, et l'optimiseur de la base de données détermine comment l'obtenir

Les langages déclaratifs sont préférables pour les bases de données car :
- L'optimiseur peut s'améliorer sans modifier les requêtes
- Ils sont plus faciles à paralléliser
- Ils masquent les détails d'implémentation

### MapReduce

Un modèle de programmation pour traiter de grandes quantités de données sur de nombreuses machines. Il n'est ni entièrement déclaratif ni entièrement impératif — vous écrivez des fonctions `map` et `reduce` (qui doivent être pures), et le framework gère la distribution.

MongoDB prend en charge une API de requêtes similaire à MapReduce, mais a également introduit le **pipeline d'agrégation** comme alternative plus déclarative.

## Modèles de données orientés graphe

Lorsque les relations plusieurs-à-plusieurs dominent vos données, il est naturel de les modéliser sous forme de **graphe** : des sommets (nœuds) reliés par des arêtes (relations).

Exemples : réseaux sociaux, liens web, réseaux routiers, détection de fraude.

### Graphes de propriétés (Neo4j, etc.)

- Chaque **sommet** possède un identifiant unique, un ensemble d'arêtes entrantes/sortantes et une collection de propriétés (paires clé-valeur)
- Chaque **arête** possède un identifiant unique, un sommet de départ, un sommet d'arrivée, un libellé décrivant la relation et des propriétés
- Tout sommet peut se connecter à tout autre sommet — aucun schéma ne restreint les types d'éléments pouvant être connectés

Langage de requêtes : **Cypher** — un langage déclaratif pour les graphes de propriétés.

```
MATCH (person)-[:BORN_IN]->(place)-[:WITHIN*0..]->(usa:Location {name: 'United States'})
RETURN person.name
```

### Triple-Stores (RDF)

Toute l'information est stockée sous forme de triplets **(sujet, prédicat, objet)**. Le sujet est un sommet, et l'objet est soit une valeur primitive (propriété), soit un autre sommet (arête).

Langage de requêtes : **SPARQL** — similaire à Cypher mais pour les triple-stores.

### Datalog

Le plus ancien des trois, fondamental pour les langages de requêtes ultérieurs. Il utilise un ensemble de règles qui peuvent être combinées et réutilisées, ce qui le rend puissant pour les requêtes complexes.

## Points clés à retenir

1. **Aucun modèle de données n'est le meilleur pour tout** — choisissez en fonction de vos modes d'accès
2. **Les bases document** excellent lorsque les données sont autonomes et que les relations sont principalement un-à-plusieurs
3. **Les bases relationnelles** restent le meilleur choix par défaut pour la plupart des applications avec des données interconnectées
4. **Les bases orientées graphe** sont idéales lorsque tout peut être en relation avec tout
5. **Les langages de requêtes déclaratifs** surpassent les impératifs dans les bases de données car ils permettent l'optimisation
6. Les modèles de données convergent — les bases relationnelles ajoutent des fonctionnalités document, les bases document ajoutent des fonctionnalités relationnelles

---
*Traduit par Claude*
