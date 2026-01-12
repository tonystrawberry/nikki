---
title: "Ma préparation pour l'entretien développeur avec TokyoDev"
date: "2026-01-11"
excerpt: "Demain, je passe un entretien avec TokyoDev pour me présenter et parler de mon travail chez Spacely."
author: "Tony Duong"
category: "daily"
tags: ["tokyo", "interview", "spacely"]
coverImage: "/images/posts/2026-01-12/cover.jpeg"
---

Demain, je passe un entretien avec TokyoDev pour me présenter et parler de mon travail chez Spacely.
Je ne suis pas très doué pour les interviews, alors j'ai besoin de préparer quelques questions à l'avance lol.

# Pourquoi suis-je venu au Japon ?

Mon arrivée au Japon n'était en fait pas du tout prévue. En 2018, j'étais sur le point d'obtenir mon diplôme universitaire au Canada et j'ai trouvé par hasard sur Facebook une offre d'emploi pour une entreprise française basée à Tokyo.

À la base, je cherchais un emploi à Montréal, mais j'ai décidé de tenter ma chance et de venir ici ! J'ai toujours été fan du Japon, mais je n'avais pas de projet précis d'y vivre. J'imagine que c'était le destin (ou le plan de Dieu). Je suis ici depuis et j'apprécie vraiment la vie ici !

# Pourquoi as-tu décidé de rejoindre Spacely ?

Avant Spacely, je travaillais comme Backend Tech Lead dans un grand cabinet de conseil. Même si j'y ai beaucoup appris, le travail pour des clients impliquait souvent des délais serrés où nous devions privilégier la vitesse de livraison à la qualité du code.

J'ai fini par atteindre un point où je voulais retourner au développement interne (chez l'annonceur) pour pouvoir me concentrer sur la construction d'un produit avec plus de profondeur et d'ownership. De plus, en tant que tech lead, mon rôle était de me concentrer sur la direction des projets à un niveau plus élevé, ce qui signifie beaucoup de réunions, beaucoup de revues de code et de mentorat, même si je me portais volontaire pour participer aussi au développement. Mais je voulais "mettre les mains dans le cambouis" davantage. J'aime coder. C'est pour ça que j'ai rejoint Spacely. Le produit m'a fasciné, surtout le lecteur VR et le home staging virtuel.

Le produit principal de Spacely est une plateforme pour les agents immobiliers leur permettant de gérer leurs propriétés et leurs clients. Les biens peuvent être visualisés dans une visionneuse 3D sur le site web ou en utilisant des casques VR. Un cas d'utilisation, par exemple, est de permettre aux acheteurs ou locataires potentiels de visiter une propriété en 3D avant de décider de s'y rendre physiquement. Il est aussi possible de visualiser des propriétés non construites (modèles 3D), d'ajouter des meubles virtuels, de gérer les clients avec un CRM, etc.

J'apprécie aussi beaucoup l'équilibre ici. On avance vite, mais on a aussi cette règle des 30% où l'on consacre du temps dans chaque sprint au refactoring et à la correction de bugs. Cet engagement envers la qualité, combiné à la culture du travail à distance et à la petite taille de l'équipe, en a fait le choix parfait pour moi.

# Peux-tu m'en dire plus sur ton rôle ? Titre, missions et fonctionnement de l'équipe ?

Je suis Team Lead Backend Engineer chez Spacely. Comme le titre l'indique, je me concentre sur le backend de notre application web. Cela implique le développement de nouvelles fonctionnalités en étroite collaboration avec les PMs et les autres équipes (Frontend, Mobile, R&D), ainsi que la maintenance de la base de code via le monitoring des performances et la correction de bugs.

Au-delà du code, je gère des tâches managériales comme animer les réunions d'équipe, faire le reporting aux chefs de projet, et gérer le recrutement et l'onboarding. Travailler dans une startup demande de la polyvalence, il faut être présent sur tous les fronts. Je me suis senti soutenu par mon équipe dès le premier jour, ce qui a été une énorme motivation pour grandir et faire du bon travail.

Pour notre processus, nous suivons la méthode Scrum avec des sprints de deux semaines. Nous allouons strictement 70% de notre temps au développement de fonctionnalités et 30% aux "tâches de santé" (refactoring et dette technique). Nous avons de courts daily standups pour nous aligner sur les progrès, et bien que les membres individuels soient responsables de projets spécifiques, nous mettons l'accent sur la revue croisée du code. Cela garantit que la connaissance est partagée dans toute l'équipe plutôt que d'être cloisonnée chez une seule personne.

# Parle-moi du processus de développement chez Spacely. Comment décidez-vous sur quoi travailler et comment le livrez-vous ?

Chez Spacely, ce sont les PMs qui décident des prochains chantiers. Ils proposent les idées et nous avons une réunion toutes les deux semaines pour en discuter (faisabilité, priorité, planning, etc.). Nous avons une roadmap et nous savons déjà sur quelles fonctionnalités nous allons travailler pour les 6 prochains mois.

Ensuite, quand nous commençons vraiment à travailler sur une fonctionnalité, nous découpons les tâches et les définissons dans Jira. Nous créons donc la tâche EPIC et ensuite des sous-tâches assignées aux membres de l'équipe (FE, BE, Mobile, R&D).

Nous utilisons aussi Notion pour rédiger les spécifications avant de commencer à coder. Cela nous aide à avoir une compréhension claire de la fonctionnalité et de la partager avec l'équipe, pour que tout le monde soit sur la même longueur d'onde et demande des ajustements si besoin. Nous prévoyons d'utiliser un serveur MCP couplé à un agent de codage pour accélérer le processus de développement.

Après ça, on met les mains dans le code. On utilise beaucoup Slack pour communiquer, partager nos progrès, demander de l'aide. Tout le monde est très réactif chez Spacely, donc quand on a une question, on peut la poser directement et on obtient une réponse rapidement.

Quand on veut livrer une fonctionnalité, elle doit être testée par le Customer Success et le Product Manager sur l'environnement de staging. Ce sont eux les garants de la satisfaction client, donc ce sont eux qui testent et nous font les retours.

Une fois la fonctionnalité testée et approuvée, on peut la déployer en production. Nous utilisons GitHub Actions pour déployer le code sur l'environnement de production qui est hébergé sur AWS.

# Quelle est la partie la plus amusante ou créative de ton travail ?

Eh bien, ce que j'aime ici, c'est qu'on peut tout faire (tant que ça profite à l'entreprise). On a très peu de contraintes et c'est un environnement très ouvert où l'on peut proposer de nouvelles idées et projets.

Si tu veux travailler sur un serveur MCP, tu peux. Tu veux améliorer certaines parties de l'application non liées à tes fonctionnalités assignées ? C'est bon ! Tu veux proposer une nouvelle façon d'écrire la base de connaissances ? Demande juste et tu auras le soutien nécessaire. En fait, depuis mon arrivée l'année dernière, j'ai essayé de proposer des améliorations (au niveau technique mais aussi organisationnel) et la plupart ont été adoptées. Tout le monde a été très encourageant et flexible. Tu veux bosser sur l'infra aussi ? Consulte l'équipe infra et ils t'aideront à démarrer.

J'aime le fait de pouvoir coder concrètement et travailler au plus près du produit, en développant de nouvelles fonctionnalités. J'adore aussi refactoriser le code pour le rendre plus maintenable et lisible pour tous (surtout pour les nouveaux arrivants). Spacely a maintenant 8 ans et comme toute base de code, elle a des défauts, donc je suis très motivé pour l'améliorer.

# Quelle a été la chose la plus difficile ?

Rattraper le niveau sur la base de code et comprendre la logique métier. Comme je l'ai dit, Spacely a 8 ans et ce n'est pas si facile de comprendre le code quand on est nouveau. Certaines parties n'étaient pas très bien documentées, donc on n'est parfois pas très sûr de l'intention réelle derrière le code MAIS cela s'améliore à bon rythme. Nous adoptons l'amélioration continue donc nous essayons de laisser le code dans un meilleur état que nous l'avons trouvé.

Et équilibrer le temps entre les tâches de fonctionnalités et les tâches de santé. Nous avons une règle 70/30, mais ce n'est jamais exactement 70/30. Nous avons tendance à avoir plus de tâches de fonctionnalités bien sûr, car c'est ce dont le business a besoin, mais nous finissons par retarder les tâches de santé quand nous manquons de temps.

# Qu'est-ce qui, selon toi, distingue Spacely des autres entreprises ?

Une culture très ouverte. Tout le monde est très amical et solidaire, pour de vrai. Je ne parle que pour moi, mais j'ai l'impression qu'on s'entend tous plutôt bien.
Un environnement de travail très flexible. Nous ne sommes pas liés à un horaire fixe. On peut travailler de chez soi, du bureau, de n'importe où.
Un très bon équilibre vie pro/vie perso. On ne travaille pas 12 heures par jour, la plupart du temps on ne fait pas d'heures sup. Il est même possible de faire du travail secondaire (副業) si on veut, pour une autre entreprise.

Et nous essayons d'utiliser beaucoup l'IA dans les fonctionnalités du produit (certaines de nos fonctionnalités récentes impliquent l'utilisation de l'IA pour générer des meubles sur des images immobilières par exemple, ou pour générer des légendes basées sur les informations de la base de données) et dans le processus de développement.

# Pourquoi recommanderais-tu à un autre développeur de rejoindre Spacely ?

Eh bien, j'ai décrit beaucoup de bonnes choses sur Spacely dans les questions précédentes. Je dirais que la raison principale de rejoindre Spacely est la culture ouverte et la flexibilité de l'environnement de travail.
