---
title: "Ne construisez pas des agents, construisez des skills"
date: "2026-03-13"
excerpt: "Notes sur la presentation d'Anthropic au sujet des agent skills -- des dossiers organises qui encapsulent des connaissances procedurales composables, complementant les serveurs MCP dans l'architecture emergente des agents generaux."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ai", "claude", "agents", "skills", "mcp"]
youtubeUrl: "https://www.youtube.com/watch?v=CEvIs9y1uog"
---

## Apercu general

Barry Zhang et Mahesh Murag d'Anthropic presentent les **agent skills** -- un nouveau paradigme pour etendre les agents generaux comme Claude Code. Au lieu de construire des agents separes pour chaque domaine, ils soutiennent qu'il faut construire des **skills** : des dossiers organises de connaissances procedurales que n'importe quel agent peut utiliser.

## Le probleme : l'intelligence sans l'expertise

Les agents d'aujourd'hui sont comme un genie avec un QI de 300 mais sans experience dans un domaine. Ils peuvent raisonner a partir de principes fondamentaux, mais ce n'est pas ce que vous voulez pour vos impots -- vous voulez un expert du domaine qui execute de maniere coherente.

Les agents actuels :
- Sont brillants mais manquent d'expertise
- Peuvent faire des choses incroyables avec suffisamment de guidage, mais manquent de contexte important en amont
- N'absorbent pas bien votre expertise
- N'apprennent pas avec le temps

## Que sont les skills ?

Les skills sont des **collections organisees de fichiers qui encapsulent des connaissances procedurales composables pour les agents**. En pratique : ce sont des dossiers.

Cette simplicite est deliberee :
- N'importe qui (humain ou agent) peut les creer et les utiliser
- Ils fonctionnent avec les outils existants -- versionnes dans Git, partages via Google Drive, compresses et envoyes
- Ils peuvent inclure des scripts comme outils en plus des instructions

### Pourquoi des fichiers plutot que des outils traditionnels ?

Les outils traditionnels ont des problemes :
- Instructions mal ecrites, comportement ambigu
- Quand le modele a des difficultes, il ne peut pas modifier l'outil -- il est bloque
- Ils occupent toujours la fenetre de contexte

Le code et les fichiers resolvent ces problemes :
- Auto-documentes
- Modifiables par l'agent
- Peuvent rester dans le systeme de fichiers jusqu'a ce qu'on en ait besoin

### Divulgation progressive

Les skills protegent la fenetre de contexte grace a la divulgation progressive :
1. A l'execution, seules les **metadonnees** sont affichees (nom/description du skill)
2. Quand necessaire, l'agent lit le **SKILL.md** avec les instructions principales
3. Tout le reste (scripts, ressources, exemples) est organise dans le dossier pour un acces a la demande

Cela permet d'integrer **des centaines de skills** tout en les gardant composables.

## Types de skills

### Skills fondamentaux
Capacites generales ou specifiques a un domaine que l'agent ne possedait pas auparavant.
- **Document skills** (par Anthropic) : creation/edition de documents Office professionnels
- **Scientific research skills** (par Cadence) : analyse de donnees de dossiers medicaux electroniques, bibliotheques de bio-informatique

### Skills tiers
Des partenaires qui construisent des skills pour leurs propres produits :
- **Browserbase/Stagehand** : automatisation du navigateur et navigation web
- **Notion** : recherche approfondie sur l'ensemble de votre espace de travail

### Skills d'entreprise
Skills specifiques a l'entreprise et a l'equipe :
- Enseigner aux agents les meilleures pratiques organisationnelles
- Equipes de productivite developpeur deployant aupres de milliers de developpeurs
- Encodage du style de code, des connaissances sur les outils internes et des workflows

## L'architecture emergente des agents generaux

L'architecture converge vers :

1. **Boucle d'agent** -- gere le contexte interne et le flux de tokens
2. **Environnement d'execution** -- systeme de fichiers + capacite de lire/ecrire du code
3. **Serveurs MCP** -- outils et donnees du monde exterieur (connectivite)
4. **Bibliotheque de skills** -- des centaines/milliers de skills charges dans le contexte a la demande (expertise)

**MCP fournit la connexion ; les skills fournissent l'expertise.**

Donner a un agent de nouvelles capacites dans un nouveau domaine = l'equiper avec les bons serveurs MCP + les bons skills.

## Directions futures

### Les skills en tant que logiciel
A mesure que les skills deviennent plus complexes (empaquetage d'executables, binaires, ressources), ils necessitent :
- **Tests et evaluation** -- mesurer la qualite des resultats
- **Outillage de declenchement** -- s'assurer que les skills se chargent au bon moment pour la bonne tache
- **Versionnage** -- suivre les changements de comportement dans le temps
- **Dependances** -- skills faisant reference a d'autres skills, serveurs MCP ou packages

### Apprentissage continu
Les skills sont concus comme une etape concrete vers l'apprentissage continu :
- Tout ce que Claude ecrit peut etre utilise par une version future de lui-meme
- La memoire devient tangible -- capturer les connaissances procedurales pour des taches specifiques
- Claude peut acquerir, faire evoluer et abandonner des skills selon les besoins
- Objectif : Claude au jour 30 est bien meilleur que Claude au jour 1

### Partage et distribution
La vision la plus enthousiasmante : une **base de connaissances collective et evolutive** curatee par des humains et des agents :
- Les nouveaux membres de l'equipe obtiennent un agent qui connait deja les pratiques de l'equipe
- Les skills construits par la communaute rendent les agents de tout le monde plus performants
- Similaire a la facon dont les serveurs MCP communautaires beneficient a tous les agents

## L'analogie informatique

| Informatique | IA |
|-----------|-----|
| Processeurs | Modeles |
| Systemes d'exploitation | Runtimes d'agents |
| Applications | Skills |

Quelques entreprises construisent des processeurs et des systemes d'exploitation, mais des millions de developpeurs construisent des applications. Les skills ouvrent cette "couche applicative" a tout le monde.

## Points cles a retenir

1. **Le code est l'interface universelle** -- Claude Code est en realite un agent generaliste, pas seulement un outil de developpement
2. **Skills = dossiers** -- deliberement simple pour que n'importe qui puisse les creer et les partager
3. **La divulgation progressive** protege la fenetre de contexte tout en permettant des centaines de skills
4. **MCP + Skills** sont complementaires -- MCP pour la connectivite, les skills pour l'expertise
5. **Arretez de reconstruire des agents** -- l'agent est universel ; personnalisez-le avec des skills
6. **Les skills permettent l'apprentissage continu** -- des agents qui s'ameliorent au fil de l'utilisation

---
> 🌐 *Traduit par Claude*
