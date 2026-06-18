---
title: "Chapitre 5 : Spacely"
date: "2026-06-15"
excerpt: "Un vélo de Tokyo à Osaka, de la neige que je n'avais pas prévue, puis Spacely — une plateforme VR japonaise, une équipe backend de quatre personnes, une mise à niveau de Rails qui m'a appris tout le code, un job central rendu 4× plus rapide, des alertes Honeybadger passées de 10 000 à moins de 300, et le rôle de Tech Lead. Un an et demi qui m'a paru en faire quatre. Et puis la France."
author: "Tony Duong"
category: "note"
categories: ["work", "reflections"]
tags: ["career-story", "career", "personal", "japan", "tokyo", "spacely", "rails", "aws", "leadership", "freelance"]
coverImage: ""
collection: "career-story"
collectionOrder: 5
collectionTitle: "Histoire de ma carrière"
---

Mon dernier jour chez Monstarlab était aux alentours du 15 décembre, juste avant Noël et le Nouvel An. Je ne me suis pas précipité vers la suite. J'ai pris le temps.

D'abord, des moments avec ma femme et mes beaux-parents dans sa ville natale, Karatsu. J'adore cette ville — une ville côtière, paisible et calme, et elle a un château. Le genre d'endroit qui fait baisser le rythme d'un cran dès qu'on y arrive.

Ensuite, j'ai fait quelque chose dont j'avais envie depuis un moment : un voyage à vélo de Tokyo à Osaka. Seul. Un sacré voyage. J'ai même roulé sous la neige sur une partie du trajet — complètement imprévu. Le Japon est *montagneux*, et certaines pentes étaient brutales, mais pour une raison ou une autre, j'ai trouvé l'énergie quelque part pour toutes les gravir sans m'arrêter. Je ne sais toujours pas vraiment comment j'ai fait. De merveilleux souvenirs.

Et puis je suis rentré à Tokyo, et j'étais prêt pour Spacely.

## L'arrivée dans l'équipe backend

J'ai rejoint l'entreprise comme ingénieur backend senior. L'équipe backend comptait quatre ingénieurs, et dès le premier jour, tout le monde était chaleureux et véritablement bienveillant. Ils m'ont dit qu'ils avaient été impressionnés par mon test technique — et je l'avoue, j'y avais vraiment donné le meilleur de moi-même.

Quelques mots sur ce qu'est Spacely : c'est une plateforme VR cloud B2B japonaise, à laquelle font confiance plus d'un millier d'entreprises des secteurs de l'immobilier et du logement. Elle permet aux entreprises de transformer des photos ou des données 3D en contenu VR panoramique 360° immersif en aussi peu que trente minutes — ce qui les aide à générer des demandes de renseignements, des visites de showroom et des conversions. Mon travail, c'était le backend de toute la plateforme : maintenir l'ensemble en bon état de marche et livrer rapidement de nouvelles fonctionnalités.

Voici ce que j'ai ressenti presque immédiatement chez Spacely — le fruit de mes six années d'ingénierie précédentes. Pour la première fois, je n'étais pas en train de me dépasser dans le vide. L'éventail des sujets sur lesquels on m'a sollicité était large, et la plupart d'entre eux tombaient là où j'avais déjà du terrain solide sous les pieds.

## Un an et demi tous azimuts

Je ne vais pas prétendre qu'il s'agissait d'une seule histoire bien rangée. C'était une grande variété de travaux, souvent en même temps, et c'est précisément cette variété que j'ai adorée.

J'ai construit des fonctionnalités en échangeant étroitement et régulièrement avec les PM. J'ai travaillé sur le workflow de développement backend lui-même, d'une douzaine de petites façons — en établissant des règles de codage, par exemple, qui vivent désormais à l'intérieur de nos fichiers `AGENTS.md` pour que les outils d'IA les suivent. J'ai proposé de migrer notre documentation de Qiita vers Notion, qui s'est révélé être un bien meilleur foyer pour organiser toute la base de connaissances technique.

Une grande partie de mon énergie est passée dans le travail peu glorieux mais cumulatif : refactoriser, améliorer la qualité du code, rendre les choses lisibles, introduire des outils qui rendent le quotidien meilleur pour tout le monde. Sur un an et demi, avec mes collègues, nous avons tissé l'IA dans presque toutes les parties du workflow — de l'écriture du code à sa maintenance. Une chose dont je suis discrètement fier : j'ai pris un job central que la plateforme exécute plus de 10 000 fois par jour et je l'ai rendu environ **4× plus rapide**. J'ai détaillé celui-là par écrit, si ça vous intéresse — [rendre la génération de cubemap 360° ~4× plus rapide](/fr/posts/off-the-worker-into-lambda-360-cubemap-generation-4x-faster).

J'ai aussi mené un projet d'**évaluation de vulnérabilité** — discuter avec d'éventuelles entreprises de sécurité, cadrer la mission, la piloter. Je me suis porté volontaire pour celui-là exprès, parce que j'estimais que c'était le moyen le plus rapide d'avoir une vue d'ensemble de tout le code. J'aime avoir cette vue : savoir comment les composants s'assemblent réellement, et pas seulement le coin sur lequel je travaille à un instant donné.

La **mise à niveau de Rails de 7.1 à 7.2** grattait la même démangeaison, mais par la voie difficile. Nous fonctionnons avec une configuration multi-bases de données, et la mise à niveau a cassé beaucoup de tests unitaires qui s'étendaient sur plus d'une base. Ça m'a pris beaucoup de temps — mais une tâche pareille touche à chaque partie du code, alors à la fin, je le connaissais bien mieux qu'avant. Ça valait le coup.

Une bonne partie de mon temps est partie dans l'infrastructure et la conception système, où mon expérience AWS — et tout ce que j'avais absorbé en préparant les certifications — a payé encore et encore. Les services que je manipule presque tous les jours : Step Functions, Lambda, API Gateway, ECS, et la couche réseau avec ALB et VPC. J'ai aussi automatisé notre **génération de spécification d'API** pour qu'elle soit produite directement à partir du code source. Elle était auparavant maintenue à la main dans un dépôt séparé — deux fois plus de travail, et difficile à garder fidèle. La générer depuis le code la rend fiable par construction.

Et je me suis *beaucoup* rapproché de **Datadog** — logs, traces, métriques. J'ai reconstruit des dashboards et normalisé plus de cinquante alertes : leur nommage, leurs messages, leurs runbooks. Un travail peu sexy qui rend discrètement chaque futur incident moins douloureux.

Côté débogage — et j'adore vraiment déboguer — j'ai fait passer nos **alertes Honeybadger d'environ 10 000 à moins de 300** en l'espace de deux semaines. Celui-là procurait une satisfaction difficile à expliquer aux non-ingénieurs.

J'ai aussi construit une **application Jira** qui nous a enfin donné des burndown et velocity charts honnêtes. Jira par défaut ne pouvait pas faire ce qu'il nous fallait — nous avons de nombreux statuts qui devraient compter comme DONE mais pas dans les rapports standard, et les story points vivent dans des champs personnalisés différents à travers plusieurs workspaces Jira. Sans agréger tout ça correctement, nous n'avions aucun moyen précis de voir à quelle vitesse l'équipe de développement avançait réellement.

## Devenir Tech Lead

En décembre 2025, dix mois après mon arrivée, je suis devenu **Tech Lead**. Je ne m'attendais pas à autant aimer ça.

Il y avait les choses évidentes — accueillir les nouveaux membres, animer les réunions. Mais je me suis aussi attaqué aux réunions elles-mêmes : j'ai supprimé toutes les réunions récurrentes inutiles que je pouvais, et j'ai pris l'initiative de rendre notre **« Product Dive »** hebdomadaire plus vivant. C'est une réunion où n'importe quel ingénieur peut présenter ce sur quoi il a travaillé, aussi modeste que ce soit. L'idée est d'élever la conscience que chacun a du travail des autres et de partager les connaissances — parce que nous avons tendance, en tant qu'ingénieurs, à disparaître dans nos propres bulles. Même un petit nouveau bouton mérite d'être connu de l'équipe. On garde le daily standup où l'on dit ce qu'on fait, mais on ne *comprend* pas vraiment un travail tant que quelqu'un ne vous l'a pas expliqué clairement.

J'ai aussi écrit **quatre articles** pour le blog tech de l'entreprise. Et — parce que je ne peux pas m'en empêcher — j'ai prototypé un tout nouveau design pour le blog, parce que je trouve que l'actuel fait très années 2000. [Voici la proposition.](https://spacely-blog-nuxt.vercel.app/en) Je le trouve bien plus joli et il donne réellement envie de lire et de découvrir l'entreprise. Mes collègues n'étaient pas emballés, alors j'ai laissé tomber. Aucun regret — c'était un bon exercice, et ça vaut quelque chose en soi.

Quelque part là-dedans, Spacely m'a aussi demandé de représenter l'entreprise dans une interview avec **TokyoDev**, l'une des plateformes d'emploi pour ingénieurs les plus populaires au Japon. [Voici l'interview](https://www.tokyodev.com/companies/spacely/interviews/tony-duong), si ça vous intéresse.

Et à côté, j'ai construit **Shirimono** — une application d'apprentissage du japonais — et j'ai livré à la fois la version web et une application mobile (elle est [sur l'App Store](https://apps.apple.com/jp/app/shirimono/id6759329826)). C'était très amusant à construire, et c'est gratuit, alors si vous apprenez le japonais, essayez-la.

Ça fait… beaucoup. Je sais. Tout est encore si frais que ça déborde. Un an et demi chez Spacely m'a paru en faire trois ou quatre — on a fait tellement de choses, et je me suis amusé à le faire, et tout cela revient en grande partie à mes coéquipiers. Ouverts aux idées nouvelles, d'un soutien sans fin, et un EM qui m'a accordé une liberté remarquable.

## Le tournant — retour en France

On est maintenant en juin, et ma femme et moi avons décidé de rentrer en France. Elle me manquait. Ma famille me manquait. Cette envie de bouger que j'ai appris à écouter pointait cette fois vers la maison, pas vers une autre entreprise.

J'ai donc démissionné de Spacely en tant que salarié à temps plein — et ils m'ont offert la possibilité de continuer à travailler avec eux depuis la France, en freelance. Je leur en suis sincèrement reconnaissant.

Spacely est une entreprise où l'individu est réellement valorisé, et ça se ressent. Tant de mes collègues ont pris des congés paternité ou maternité pendant des mois, et les gens se remplaçaient les uns les autres sans rancœur, présents exactement dans les moments qui comptent. Ce n'est pas une petite chose, et ce n'est pas courant. Je recommanderais cette entreprise à n'importe qui.

Un nouveau chapitre commence en France. Mais ça, c'est une page que je n'ai pas encore écrite.

---

## Réalisations

Un compte rendu plus concret de ce que j'ai fait durant mon passage chez Spacely :

- **Rejoint une équipe backend de quatre personnes comme Senior Backend Engineer** (Ruby on Rails), responsable du backend de toute la plateforme VR, et **promu Tech Lead** dix mois plus tard (décembre 2025).
- **Rendu un job de production central ~4× plus rapide** — une conversion 360°-vers-cubemap gourmande en CPU, exécutée plus de 10 000 fois par jour — en le déplaçant des workers Sidekiq partagés vers AWS Lambda. ([Compte rendu complet.](/fr/posts/off-the-worker-into-lambda-360-cubemap-generation-4x-faster))
- **Fait passer les alertes d'erreur Honeybadger d'environ 10 000 à moins de 300** en l'espace de deux semaines grâce à une correction de bugs ciblée.
- **Construit une application Jira sur mesure** pour les burndown et velocity charts — agrégation de multiples statuts DONE et champs de story points à travers plusieurs workspaces Jira, ce que Jira par défaut ne permettait pas de configurer.
- **Mené un projet d'évaluation de vulnérabilité** de bout en bout — évaluation des entreprises de sécurité, cadrage et pilotage de la mission — en partie comme la voie la plus rapide vers une vue d'ensemble du code.
- **Mis à niveau Rails de 7.1 à 7.2** sur une configuration multi-bases de données, en réparant les nombreux tests inter-bases que cela a cassés en chemin.
- **Mené les travaux d'infrastructure et de conception système** sur AWS — Step Functions, Lambda, API Gateway, ECS, et la couche réseau ALB/VPC — appuyés par une expérience concrète et plusieurs certifications AWS.
- **Automatisé la génération de spécification d'API** directement à partir du code source, remplaçant une spec maintenue à la main dans un dépôt séparé par une spec fiable par construction.
- **Établi les règles de codage de l'équipe** (désormais intégrées dans les fichiers `AGENTS.md`) et contribué à tisser l'IA dans presque chaque étape du workflow de développement, de l'écriture du code à sa maintenance.
- **Migré la documentation de l'équipe de Qiita vers Notion**, offrant à la base de connaissances technique un foyer mieux organisé.
- **Refondu l'observabilité Datadog** — reconstruction des dashboards et normalisation du nommage, des messages et des runbooks de plus de 50 alertes.
- **Remodelé les réunions de l'équipe en tant que Tech Lead** — suppression des réunions récurrentes inutiles et revitalisation de la session hebdomadaire de partage de connaissances « Product Dive ».
- **Écrit quatre articles** pour le blog tech de l'entreprise, et prototypé une refonte complète du blog en guise de proposition.
- **Représenté Spacely dans une [interview TokyoDev](https://www.tokyodev.com/companies/spacely/interviews/tony-duong)**, l'une des principales plateformes d'emploi pour ingénieurs au Japon.

---

> 🌐 *Traduit par Claude*
