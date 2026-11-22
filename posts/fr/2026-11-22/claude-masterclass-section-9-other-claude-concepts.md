---
title: "Masterclass Claude · 9 : Claude dans Office et autres fonctionnalités"
date: "2026-11-22"
excerpt: "Claude dans PowerPoint et Excel (avec les skills), les groupes d'onglets Chrome pour l'extension, l'import de la mémoire depuis ChatGPT, et quelques fonctionnalités sous-utilisées."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["claude", "excel", "powerpoint", "chrome", "udemy"]
collection: "claude-masterclass"
collectionOrder: 9
collectionTitle: "Masterclass Claude (Udemy)"
---

## TL;DR

Claude vit désormais **dans Office** (les deux compléments étaient en bêta au moment de l'enregistrement du cours), l'extension Chrome organise son travail en **groupes d'onglets**, et on peut rapatrier sa **mémoire ChatGPT** en quelques minutes.

## Claude dans PowerPoint

- L'installer depuis claude.com → *Meet Claude* → **Claude for PowerPoint** (Microsoft Store), puis ouvrir **Add-ins → Claude** et se connecter.
- Il peut construire des présentations entières, ajouter des slides avec le thème et les polices existants, ou modifier **uniquement les formes sélectionnées** (maintenir Shift pour en sélectionner plusieurs).
- Le panneau latéral propose les skills, les connecteurs, la recherche web et un mode « ask before editing ». Il vérifie son propre travail visuel, par exemple en corrigeant les espacements.

## Claude dans Excel

- L'installer de la même façon, ou via Add-ins → *Get add-ins* → « Claude by Anthropic ».
- Usages vus dans le cours : déboguer une feuille cassée, modélisation financière (« ajoute un récapitulatif annuel et mets en évidence le paiement ballon de l'année 5 »), **extraire les états financiers d'un rapport annuel en PDF**, et construire des dashboards et des graphiques.
- En bêta, s'il se comporte mal, se déconnecter et se reconnecter ou le réinstaller. Enregistrer son fichier avant les gros changements.

## Skills dans Office

Cliquer sur **+** pour y utiliser ses skills Cowork, ou les skills intégrées : `/deck-refresh` met à jour une présentation avec de nouveaux chiffres, et il existe une skill de QA de présentations pour la banque d'investissement. Ajouter les siennes sous *Manage skills*, par exemple « applique l'identité visuelle de mon entreprise à n'importe quel PowerPoint ».

## Groupes d'onglets Chrome et extension

Chaque nouveau chat Claude-in-Chrome crée son propre **groupe d'onglets**, et Claude ne contrôle que les onglets de ce groupe. Un groupe fonctionne comme un dossier de projet : on le replie, on le ferme, et on rouvre toute la tâche en un clic.

## Passer de ChatGPT à Claude

1. Dans Claude, aller dans **Settings → Capabilities → Import memory from other AI providers** et copier le prompt.
2. Dans ChatGPT, activer le mode **Thinking** et vérifier que les trois réglages *reference saved memories / chat history* sont activés, puis coller le prompt.
3. Recoller la réponse de ChatGPT dans Claude et cliquer sur **Add to memory**.

## Fonctionnalités sous-utilisées

- **Plusieurs modèles dans une même requête** : « utilise Sonnet pour la recherche web, puis Opus pour le résumé du PDF » économise des tokens.
- **Diagrammes interactifs** directement dans le chat (« explique les réseaux de neurones avec un diagramme »), téléchargeables en HTML.
- **Instructions de dossier** dans les projets Cowork, et sélection de **plusieurs dossiers** à la fois.
- **Tâches planifiées** (« lance ça tous les jours à 11 h »), **instructions globales**, et mémoire.

---

> 🌐 *Traduit par Claude*
