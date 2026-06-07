---
title: "Spec-Driven Development : le codage assisté par IA expliqué"
date: "2026-03-13"
excerpt: "Notes sur le spec-driven development — comment la rédaction de spécifications avant le code réduit l'ambiguïté et améliore le codage assisté par IA par rapport au vibe coding."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ai", "software-engineering", "spec-driven-development", "vibe-coding"]
youtubeUrl: "https://www.youtube.com/watch?v=mViFYTwWvcM"
---

## Aperçu

Cette vidéo explique le **spec-driven development** — une approche structurée du codage assisté par IA qui réintroduit les principes du cycle de vie du développement logiciel (SDLC) à l'ère des agents de codage. Elle le compare au **vibe coding**, l'approche plus courante du type "prompter et itérer".

## Vibe Coding : le mode par défaut actuel

La plupart des utilisateurs d'agents de codage IA suivent cette boucle :

1. Écrire un prompt initial ("construis-moi X en Python")
2. Le modèle génère du code de base
3. Vous modifiez le prompt ou donnez des instructions complémentaires
4. Vous faites des allers-retours jusqu'à obtenir l'implémentation souhaitée

**Problèmes du vibe coding :**
- Le modèle peut interpréter votre prompt différemment à chaque fois — 100 essais peuvent donner 100 résultats différents
- Vous ne contrôlez pas *comment* le modèle prend ses décisions architecturales
- Il saute le SDLC traditionnel (planification, conception, tests, déploiement, maintenance)
- Le débogage est plus difficile car vous ne savez pas *pourquoi* le modèle a choisi une approche spécifique

**Là où le vibe coding excelle :** prototypes rapides, tester des idées, petites modifications à la volée.

## Spec-Driven Development : une alternative structurée

Le spec-driven development réintroduit les composantes du SDLC dans le développement généré par IA :

### Le workflow

1. **Prompter le comportement, pas l'implémentation** — au lieu de "construis-moi une page de connexion", décrivez ce que le système doit faire, ses contraintes et le comportement attendu
2. **Générer les exigences** — le LLM crée une spécification des exigences qui sert de contrat
3. **Réviser et approuver** — si satisfait, convertir les exigences en un document de conception avec des tâches pour chaque étape d'implémentation ; sinon, modifier la spécification (rien n'a encore été implémenté)
4. **Implémenter** — une fois la conception approuvée, l'agent IA écrit le code guidé par la spécification
5. **Tester** — les cas de test peuvent être générés directement à partir de la spécification

### Exemple : authentification utilisateur

**Approche vibe coding :**
> "Hé, on a besoin d'une page /login pour que les utilisateurs s'authentifient"
> → Le modèle choisit l'une des 30 implémentations possibles → allers-retours itératifs

**Approche spec-driven :**
- **Fonctionnalité :** Authentification utilisateur
- **Endpoint :** `POST /login`
- **Paramètres :** `user`, `pass`
- **Gestion des erreurs :** codes d'erreur spécifiques (ex. : nom d'utilisateur manquant)
- **Cas de test :** identifiants valides → 200, champs manquants → codes d'erreur spécifiques

La spécification supprime l'ambiguïté — l'agent sait exactement quoi implémenter et pourquoi.

## Lien avec les autres approches de développement

| Approche | Point de départ | Flux |
|----------|----------------|------|
| Traditionnelle | Le code d'abord | Code → Documentation |
| Pilotée par les tests (TDD) | Les tests d'abord | Tests → Code |
| Pilotée par les spécifications (SDD) | Les spécifications d'abord | Spécifications → Conception → Code → Tests |

Le spec-driven development est essentiellement le **TDD et le BDD sous stéroïdes** — la spécification devient l'artefact principal qui pilote tout le travail en aval : implémentation, tests, documentation et vérification.

## Points clés à retenir

1. **Le vibe coding saute le SDLC** — excellent pour le prototypage, mais produit des résultats imprévisibles pour les applications réelles
2. **Les spécifications réduisent l'ambiguïté** — les modèles d'IA fonctionnent mieux avec des instructions claires qu'avec des prompts vagues
3. **Rien n'est implémenté tant que vous n'approuvez pas** — vous révisez les exigences et la conception avant que le moindre code ne soit écrit
4. **Les spécifications deviennent le contrat** — elles pilotent l'implémentation, les tests et la documentation
5. **Le changement de compétence principal** — passer de l'écriture/révision de code à la transmission efficace de ce que vous voulez construire

---
*Traduit par Claude*
