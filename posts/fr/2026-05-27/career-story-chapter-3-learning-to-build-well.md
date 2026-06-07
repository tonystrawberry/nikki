---
title: "Chapitre 3 : Apprendre à bien construire"
date: "2026-05-27"
excerpt: "Deux ans et demi chez Overflow — une startup tokyoïte, une tâche cron Slack, un mentor du nom d'Ohtani-san, le vocabulaire AWS qui me manquait, deux side projects sous Stripe, et cette envie d'ailleurs qui m'a finalement conduit jusqu'à Monstarlab."
author: "Tony Duong"
category: "note"
tags: ["career-story", "career", "personal", "japan", "tokyo", "overflow", "aws"]
coverImage: ""
collection: "career-story"
collectionOrder: 3
collectionTitle: "Histoire de ma carrière"
---

Quand j'ai commencé à chercher mon prochain job, j'ai fait ce que la plupart des développeurs à Tokyo font : j'ai ouvert LinkedIn.

J'ai aussi tenté ma chance chez Google. Je me suis planté sur le problème d'algo. Je n'avais jamais fait de Leetcode — je n'y avais même jamais vraiment pensé — et cet entretien a été le moment où j'ai compris ce que « il faut grinder pour ça » veut vraiment dire. Recalé. C'est de bonne guerre. J'avais essayé.

Ensuite, je suis allé chez Bizreach, qui est un gros cabinet de recrutement au Japon mais qui recrute aussi des ingénieurs en interne. Tout l'entretien s'est déroulé en japonais, et j'étais franchement convaincu d'avoir bien assuré. Recalé quand même. Pas grave. À ce stade, la recherche d'emploi ressemblait plus à du calibrage qu'à un échec — je découvrais où se situait la barre.

Le déclic est venu par un chemin détourné. Un recruteur français basé à Tokyo m'a contacté sur LinkedIn, et c'est par son intermédiaire que j'ai fini par passer un entretien dans une startup appelée Overflow, basée à Ebisu. Leur produit était une plateforme de mise en relation entre ingénieurs, designers et entreprises. L'entretien lui-même a été rude. Mon japonais tenait par moments, et lâchait le reste du temps. Il y avait des questions auxquelles je n'avais pas de réponse. Je ne me souviens même plus lesquelles aujourd'hui — juste que je suis ressorti sans vraiment m'attendre à avoir une suite.

Quelques jours plus tard, un e-mail d'acceptation est arrivé dans ma boîte. J'ai dû le relire deux fois. *Attends — je vais travailler dans une boîte japonaise, en parlant japonais, tous les jours ?* La nervosité et l'excitation sont apparues en même temps, à se bagarrer dans ma poitrine.

L'intervieweur qui m'avait recruté, c'était Ohtani-san — et Ohtani-san s'est avéré être l'un des meilleurs et des plus bienveillants mentors que j'aie jamais eus. Ça se sentait dès les premières semaines de travail. Il voulait sincèrement me voir grandir en tant qu'ingénieur, et il avait la patience d'y investir vraiment du temps.

Petite anecdote : j'étais le premier employé à plein temps chez Overflow. Avant moi, tout le monde était en freelance ou à temps partiel. C'était donc un rôle un peu « fondateur », et un vrai changement de culture par rapport à Seido — où j'avais été une machine d'ingénierie à moi tout seul.

S'il fallait résumer la différence entre Seido et Overflow en une seule phrase : chez Seido j'ai appris à *construire*, et chez Overflow j'ai appris à *bien* construire.

Cela dit, Seido ne m'a pas laissé les mains vides. L'expérience concrète de Ruby on Rails que j'y avais accumulée s'est transposée directement — je pouvais naviguer dans la nouvelle codebase, livrer des features, et me rendre utile dès les premières semaines chez Overflow. La partie « apprendre à bien construire » allait prendre du temps. Mais les bases pour aller vite, je les avais déjà en main, et cet atout discret comptait plus que je ne le mesurais à l'époque.

Ce que j'ai ramassé chez Overflow s'est accumulé vite. AWS, pour de vrai cette fois — CloudFront pour le CDN, S3 pour le stockage, la couche réseau, la containerisation, la sécurité avec WAF et Shield. L'observabilité et le monitoring avec Datadog et New Relic. Tout le vocabulaire « haute disponibilité, performant, scalable » est passé du statut de phrases abstraites que je récitais en entretien à celui de concepts sur lesquels je pouvais réellement raisonner. Ma toute première tâche a été une intégration Slack qui envoyait des listes de candidats recommandés aux recruteurs via un cron — petit en termes de scope, mais ça a été livré, et j'ai remarqué un truc en le déployant : la communication, dans ce genre de boîte, était une compétence au même titre que le code. Savoir expliquer ce que tu fais et pourquoi, clairement, par écrit — c'était respecté au même niveau que le travail technique. Mon japonais oral n'était toujours pas top, mais je me suis vraiment appuyé sur la communication écrite. J'aime la structure de toute façon, donc cette partie du job me correspondait.

Les features s'enchaînaient. Un produit de blog appelé Offers Magazine. Une fonctionnalité d'analytics dans l'app principale Offers pour afficher les chiffres de funnel par étape — c'est là que j'ai appris BigQuery et ce que l'agrégation de big data donne vraiment à l'échelle. Des APIs GraphQL. Des heures et des heures de debug. Des dizaines de features sur les deux ans et quelques qui ont suivi — trop nombreuses pour que je me les rappelle individuellement aujourd'hui. Il y a eu aussi des déploiements de hotfix en urgence et des chasses au bug de dernière minute là-dedans. Je n'en ai plus les détails en tête, ce qui est probablement la meilleure chose que je puisse en dire. Je n'ai jamais détruit la base de données. Je prends.

Un retour d'Ohtani-san est arrivé tôt et m'est resté. Je livrais vite. Probablement trop vite. Il m'a pris à part dès le premier mois et m'a dit de ralentir — de me concentrer plus sur la qualité que sur la vélocité. J'ai écouté le conseil, et je suis toujours content qu'il me l'ait donné.

En dehors du travail, deux grandes choses se sont passées sur cette période. J'ai rencontré l'amour de ma vie — elle est japonaise — et même si mon japonais s'améliorait clairement dans notre quotidien à deux, je dois être honnête : mon japonais a fait *un bond énorme* au travail. Le japonais professionnel, c'est un muscle à part. Quelque part dans cette période, je me suis rendu compte que je m'étais mis à rêver en japonais, ce qui est le genre de chose qu'on ne peut pas tricher. Je comprenais de plus en plus de choses sans avoir besoin d'attraper un outil de traduction.

Je me suis aussi lancé dans deux side projects.

Le premier était une extension Chrome pour Axie Infinity — ce jeu NFT où tu élèves et échanges des monstres avec de la cryptomonnaie. J'étais joueur moi-même, et j'avais mis un peu d'argent dedans, donc je connaissais bien l'UI de la marketplace. Un jour, j'ai remarqué un truc précis : l'API exposait les *gènes* de chaque Axie, mais le site ne les affichait pas sur les listings. Or ces gènes importaient à toute personne qui prenait ses décisions de breeding au sérieux. Du coup, j'ai écrit un userscript / extension à la Tampermonkey qui récupérait les gènes via l'API et les superposait sur les cartes de la marketplace. J'ai posté un lien dans le Discord d'Axie — il y avait des milliers de personnes là-dedans — et j'ai commencé à voir des centaines de téléchargements par jour. J'ai ajouté un déverrouillage payant à l'unité via Stripe. Les gens ont payé. Au pic, ça me rapportait dans les 30 \$ par jour. Pas de quoi changer une vie, mais de l'argent réel qui rentrait pendant que je dormais, et ça, c'était une expérience nouvelle.

Le second était un site d'apprentissage du japonais appelé Shirimono — même approche, abonnements via Stripe, tout le tralala. Il a plafonné à environ trois utilisateurs payants, et je n'avais pas la bande passante pour continuer à le développer, donc je l'ai fermé. (Note de mai 2026 : j'ai repris Shirimono plus tôt cette année, je l'ai reconstruit de zéro. Donc en fait, celui-là n'est pas vraiment fermé — il a juste fait une longue pause.)

Les deux side projects mis ensemble ne m'ont jamais rendu riche, mais l'expérience de construire, déployer, monétiser et supporter ces produits valait bien plus que l'argent. Le genre d'ownership full-stack que ces projets m'ont imposé, c'était une formation à part entière.

Au bout d'environ un an chez Overflow, j'ai eu une grosse promotion. Ohtani-san m'a dit que je me situais quelque part dans le top 5 % des performeurs de l'entreprise. Le chiffre exact est peut-être un peu approximatif dans ma mémoire, mais le moment, lui, ne l'est pas — j'étais sous le choc, et je me suis senti sincèrement apprécié. C'est le genre de sensation que j'ai envie de bien garder en mémoire, parce que ce n'est pas le genre de chose qu'on contrôle.

Et puis, après environ deux ans et demi, l'envie d'ailleurs est revenue.

Ce n'était pas un problème avec la boîte ni avec les gens. C'était que je développais sur la même plateforme tous les jours, et je sentais un plafond sur la quantité de terrain nouveau que je défrichais. Je voulais à nouveau *plus*. Une idée a pris forme : et si j'allais dans un cabinet de conseil — quelque part où je serais assigné à différents clients, différentes stacks, différents problèmes, par rotation ?

Annoncer à Ohtani-san que je partais a été l'une des conversations les plus difficiles de ma carrière à ce jour. Et ce n'a pas été *une* conversation — il y en a eu plusieurs. On a enchaîné les 1:1 sur le sujet, et à chaque fois je ressortais de son bureau en me demandant *est-ce vraiment la bonne décision ?* C'est quelqu'un que je respecte énormément, et je le sentais essayer — avec douceur, jamais en forçant — de me garder. Tout le processus s'est étalé sur des mois parce qu'honnêtement, je n'avais pas envie non plus que ça se termine.

Même après ma démission formelle, Ohtani-san est resté présent pour moi. Il a continué à se rendre disponible pour me donner des conseils de carrière — il le fait encore, des années plus tard — et il m'a réembauché en freelance pour l'aider sur de nouvelles features de l'app. Le revenu supplémentaire était bienvenu. Mais bosser 2 à 3 heures après mon travail principal, tous les soirs, m'a complètement vidé. J'ai jeté l'éponge au bout d'environ quinze jours.

Je suis retourné voir le même recruteur qui m'avait présenté Overflow à la base, et je lui ai demandé s'il connaissait des cabinets de conseil qui faisaient du travail pour des clients externes. Il m'a présenté Monstarlab — un cabinet de conseil global avec des bureaux dans beaucoup de pays, et une grosse présence au Japon. L'entretien a été le plus fluide que j'avais jamais passé, et je sentais la différence. Deux ans et demi d'Overflow étaient là, posés dans mes réponses — on a parlé en profondeur de performance backend, d'AWS, de caching, de stratégies pour maintenir une base de données en haute disponibilité sous charge. Je maîtrisais ces sujets maintenant. À l'aise, pour une fois. Confiant.

J'ai eu l'offre. J'ai accepté.

Prochaine destination : Monstarlab.

---

## Réalisations

Un récapitulatif plus concret de ce sur quoi j'ai travaillé pendant ces deux ans et demi :

- **Participé au développement d'Offers**, une plateforme de mise en relation pour ingénieurs et designers, en travaillant au quotidien avec les product managers et les designers pour transformer les idées en fonctionnalités livrées.
- **Construit une intégration Slack** qui notifiait en temps réel les recruteurs et les candidats dès qu'une offre correspondante apparaissait — la bonne opportunité arrivait à la bonne personne sans que personne n'ait à rafraîchir une page.
- **Devenu un ingénieur autonome.** J'ai commencé en suivant l'ingénieur senior, mais assez rapidement c'était moi qui proposais des solutions et concevais de nouvelles fonctionnalités, au-delà de la simple implémentation.
- **Appris à communiquer efficacement en japonais**, à l'oral comme à l'écrit — l'écrit, en particulier, est devenu un point fort sur lequel je me suis appuyé.
- **Travaillé sur Offers Magazine**, un magazine numérique couvrant tout ce qui touche à l'ingénierie et au design, où j'ai mis les mains dans AWS CloudFront, WAF et S3, ainsi qu'un CMS headless avec WordPress en back-end.
- **Construit un outil d'analyse performant sur AWS Redshift**, agrégeant et extrayant des données analytiques via des requêtes SQL complexes.
- **Développé le front-end en Vue.js**, en collaboration étroite avec une designer qui me transmettait les maquettes (souvent en HTML et CSS) que je transformais en une expérience pleinement interactive, branchée sur les vraies données.

---

*Traduit par Claude*
