---
title: "Comment un Staff Engineer de Meta utilise Claude Code : 50 conseils pour le developpement agentique"
date: "2026-03-12"
excerpt: "Le guide complet de John Kim pour passer du codage manuel a l'orchestration agentique avec Claude Code -- configuration, commandes avancees et workflows professionnels."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude-code", "ai", "productivity", "engineering", "workflow"]
youtubeUrl: "https://www.youtube.com/watch?v=mZzhfPle9QU"
---

John Kim, Staff Engineer chez Meta, a partage un guide complet de 50 conseils pour passer de l'ecriture manuelle de code a l'utilisation de Claude Code comme **orchestrateur agentique**. Voici l'ensemble des conseils, organises par theme.

> Video originale : [How a Meta Staff Engineer Uses Claude Code](https://www.youtube.com/watch?v=mZzhfPle9QU)

---

## Fondations et mise en place

1. **Lancer depuis la racine** -- Lancez toujours Claude depuis le repertoire racine de votre projet pour qu'il detecte le bon contexte et les fichiers de regles.
2. **Utiliser `/init`** -- Executez cette commande sur chaque nouveau projet. Claude analysera votre architecture et generera un `CLAUDE.md` adapte automatiquement.
3. **Hierarchie de la memoire** -- Claude utilise une hierarchie : la memoire locale du projet en priorite, puis la memoire globale de l'utilisateur (`~/.claude/`), puis les instructions systeme integrees.
4. **Garder des regles concises** -- Visez environ 300 lignes dans votre `CLAUDE.md`. Un fichier trop volumineux entraine des couts de tokens plus eleves et un comportement moins precis.
5. **Architecture technique** -- Incluez les exigences techniques de haut niveau et le contexte metier dans votre fichier de regles.
6. **Patrons de conception** -- Indiquez explicitement quels patrons de conception votre projet suit pour maintenir la coherence de l'IA entre les sessions.
7. **Boucles de validation** -- La fondation la plus importante : definissez les commandes de build et de validation pour que l'IA puisse s'auto-corriger lorsque le code ne compile pas, sans intervention humaine.

---

## Raccourcis clavier

8. **Changer de mode (`Shift + Tab`)** -- Basculez instantanement entre le mode Plan (architecture) et l'acceptation des modifications (execution).
9. **Echap pour interrompre** -- Si Claude "reflechit" mais part dans la mauvaise direction, appuyez sur `Escape` pour l'arreter immediatement et le rediriger.
10. **File d'attente de prompts** -- N'hesitez pas a entrer plusieurs prompts a la suite ; Claude Code les met en file d'attente et les deduplique logiquement.
11. **Effacer l'entree (double-tap Echap)** -- Efface instantanement un grand bloc colle ou un long prompt de votre champ de saisie.
12. **Rembobiner le contexte (Echap sur entree vide)** -- Revient a un point precedent de la conversation et restaure ce contexte.
13. **Mode Vim** -- Si vous utilisez Vim, activez ce mode pour une navigation plus efficace dans le terminal.
14. **Glisser-deposer de captures d'ecran** -- Glissez et deposez des captures d'ecran directement dans le terminal pour fournir un contexte visuel lors du debogage d'interface.

---

## Commandes slash essentielles

15. **`/clear`** -- Videz la fenetre de contexte actuelle lorsque vous commencez une nouvelle fonctionnalite pour eviter que des informations obsoletes n'influencent l'IA.
16. **`/context`** -- Audit visuel des fichiers et tokens actuellement presents dans la fenetre de contexte de Claude.
17. **Auditer le surplus** -- Utilisez `/context` specifiquement pour reperer les MCPs ou fichiers qui consomment trop de tokens inutilement.
18. **Auto-compaction** -- Laissez Claude auto-compacter les longues sessions pour garder la fenetre de contexte fraiche et pertinente.
19. **`/models`** -- Basculez entre Sonnet, Haiku ou Opus. Kim recommande Opus par defaut pour le travail architectural de haut niveau.
20. **`/resume`** -- Si vous fermez accidentellement une instance de terminal, utilisez cette commande pour recuperer votre conversation et votre contexte.
21. **`/mcp`** -- Affichez et gerez vos extensions Model Context Protocol.
22. **Limiter les MCPs** -- N'installez que les MCPs necessaires au projet specifique pour eviter le surplus de tokens inutile.
23. **`/help`** -- Utilisez l'assistant integre pour decouvrir les nouvelles commandes au fil des mises a jour de Claude Code.
24. **Filet de securite Git** -- Utilisez Git comme filet de securite principal pour les modifications de code plutot que de compter uniquement sur la fonction de rembobinage interne.

---

## Gestion des regles (CLAUDE.md)

25. **Priorite de haut en bas** -- Ordonnez vos regles de la plus importante a la moins importante ; Claude les lit sequentiellement.
26. **"Ne jamais faire" vs. "Toujours faire"** -- Utilisez des contraintes explicites negatives et positives pour definir des garde-fous clairs.
27. **Extraits de code** -- Fournissez des exemples clairs du DSL specifique a votre projet ou de patterns anciens pour que Claude n'invente pas d'alternatives.
28. **Mise a jour automatique des regles** -- Au lieu de modifier `CLAUDE.md` manuellement, dites a Claude : *"Mets a jour les regles pour qu'on ne refasse jamais cette erreur."*
29. **Mots declencheurs** -- Configurez des mots-cles dans vos regles qui declenchent automatiquement des competences specifiques ou des commandes de build.
30. **Ingenierie composee** -- Committez votre `CLAUDE.md` dans le codebase pour partager les bonnes pratiques IA avec toute votre equipe.
31. **Evaluations par impression** -- Les evaluations d'IA sont difficiles a quantifier. Testez les changements de regles pendant quelques semaines avant de les fusionner dans la branche principale.

---

## Workflows avances

32. **Ignorer les permissions (mode dangereux)** -- Utilisez `--dangerously-skip-permissions` pour laisser Claude modifier les fichiers sans demander d'approbation. A utiliser avec une extreme prudence et uniquement dans des environnements jetables.
33. **`/permissions`** -- Definissez explicitement quelles actions destructrices (comme `rm -rf`) necessitent toujours une approbation manuelle, meme en mode sans permission.
34. **Commencer en mode Plan** -- Passez toujours du temps a debattre avec Claude en mode Plan avant de le laisser ecrire la moindre ligne de code.
35. **Le workflow "Starcraft"** -- Ouvrez plusieurs instances de Claude dans differents onglets de terminal et jongler entre elles pour travailler sur plusieurs fonctionnalites simultanement.
36. **Frais plutot que surcharge** -- Preferez toujours un contexte frais et condense a une longue conversation circulaire avec un historique obsolete.
37. **Le "Second cerveau"** -- Sauvegardez les resumes de session dans un repertoire local et chargez-les a la demande dans de nouvelles sessions pour preserver les decisions architecturales sur plusieurs jours.
38. **Chargement paresseux des taches** -- Gardez votre liste de taches dans un index local et ne demandez a Claude de la lire qu'en cas de besoin -- ne surchargez pas chaque session avec.
39. **Controler l'emulateur** -- Demandez a Claude de controler votre emulateur mobile, d'ajouter des logs de debug et de lire les traces via les MCPs.
40. **Navigation web avec `/chrome`** -- Faites naviguer Claude sur des sites de documentation ou remplir des formulaires via un navigateur headless lorsqu'aucune API n'est disponible.

---

## Composabilite pour utilisateurs avances

41. **Creer des competences** -- Transformez tout workflow recurrent en competence reutilisable en disant a Claude : *"Sauvegarde ce qu'on vient de faire dans une nouvelle competence."*
42. **Les competences sont des fichiers MD** -- Les competences sont simplement des prompts systeme sauvegardes dans un repertoire specifique. Vous pouvez les ouvrir et les modifier comme du texte brut.
43. **Etendre les competences** -- Demandez a Claude d'*"etendre cette competence"* pour gerer de nouvelles sources (par exemple, ajouter Twitter a une competence Hacker News existante).
44. **Sous-agents pour les effets de bord** -- Utilisez des sous-agents pour des taches atomiques qui ne necessitent pas le contexte complet du projet, gardant ainsi votre fenetre principale propre.
45. **Eviter la surutilisation des sous-agents** -- N'utilisez pas de sous-agents pour des taches necessitant une connaissance architecturale approfondie ; ils ne partagent pas la fenetre de contexte principale.
46. **Jongler entre les instances iTerm2** -- Utilisez `Cmd + D` et `Cmd + [ / ]` pour basculer rapidement entre plusieurs sessions Claude.
47. **Renommer les onglets** -- Renommez vos onglets de terminal (par exemple, "Local", "SSH distant") pour rester oriente parmi de nombreux agents paralleles.
48. **Notifications audio** -- Dites a Claude de "sonner une cloche" ou d'utiliser la synthese vocale pour resumer ce qu'il a fait lorsqu'une tache en arriere-plan se termine.
49. **Git Worktrees** -- Utilisez les Git worktrees pour travailler sur differentes branches en parallele sans conflits de code entre les sessions.
50. **Explorer l'ecosysteme** -- Telechargez des plugins et MCPs crees par la communaute pour etendre les capacites de Claude au-dela des fonctionnalites par defaut.

---

## Mes conclusions

Le fil conducteur de ces 50 conseils est la **reduction de la boucle de retour** entre l'intention et le resultat. Qu'il s'agisse des boucles de validation, du Second cerveau ou du workflow Starcraft -- chaque pattern vise a permettre a Claude de gerer davantage du cycle de maniere autonome.

Les conseils que j'applique immediatement :
- Definir les commandes de build et de lint dans `CLAUDE.md` pour que Claude valide ses propres resultats
- Utiliser `/context` pour auditer l'utilisation des tokens et reduire le surplus
- Commencer chaque tache complexe en mode Plan avant de toucher au code
- Sauvegarder les resumes de session localement pour reprendre un travail sur plusieurs jours sans perdre le contexte

---
*Traduit par Claude*
