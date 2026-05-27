---
title: "Chapitre 3 : Apprendre à bien construire"
date: "2026-05-27"
excerpt: "Deux ans et demi chez Overflow — une startup tokyoïte, une tâche cron Slack, un mentor du nom d'Ohtani-san, le vocabulaire AWS qui me manquait, deux ou trois side projects sous Stripe, et cette envie de bouger qui m'a finalement conduit chez Monstarlab."
author: "Tony Duong"
category: "note"
tags: ["career-story", "career", "personal", "japan", "tokyo", "overflow", "aws"]
coverImage: ""
collection: "career-story"
collectionOrder: 3
collectionTitle: "Histoire de ma carrière"
---

Quand j'ai commencé à chercher mon prochain job, j'ai fait ce que la plupart des développeurs à Tokyo font : j'ai ouvert LinkedIn.

J'ai aussi tenté ma chance chez Google. Je me suis planté sur le problème d'algorithmique. Je n'avais jamais fait de Leetcode — je n'y avais même jamais vraiment pensé — et cet entretien a été le moment où j'ai compris ce que « il faut grinder pour ça » voulait vraiment dire. Refusé. Mérité. J'avais essayé.

Ensuite je suis allé chez Bizreach, qui est une grande boîte de recrutement au Japon mais qui recrute aussi ses propres ingénieurs en interne. Tout l'entretien s'est déroulé en japonais, et honnêtement je pensais m'en être bien sorti. Refusé quand même. Pas grave. À ce stade, la recherche d'emploi ressemblait plus à un calibrage qu'à un échec — je découvrais où se situait la barre.

Le déclic est venu par un chemin de traverse. Un recruteur français basé à Tokyo m'a écrit sur LinkedIn, et par son intermédiaire je me suis retrouvé en entretien chez une startup appelée Overflow, à Ebisu. Leur produit était une plateforme de mise en relation pour ingénieurs et designers. L'entretien lui-même a été rude. Mon japonais tenait par moments et lâchait le reste du temps. Il y avait des questions auxquelles je n'avais pas de réponse. Je ne me souviens même plus desquelles aujourd'hui — seulement que je suis sorti sans réelle attente d'une suite.

Quelques jours plus tard, un mail d'acceptation est arrivé dans ma boîte. J'ai dû le relire deux fois. *Attends — je vais bosser dans une boîte japonaise, en parlant japonais, tous les jours ?* La nervosité et l'excitation sont arrivées en même temps, à se bagarrer dans ma poitrine.

Celui qui m'avait fait passer l'entretien, c'était Ohtani-san — et Ohtani-san s'est avéré être l'un des meilleurs et des plus bienveillants mentors que j'aie jamais eus. On le sentait dès les premières semaines. Il voulait sincèrement que je grandisse en tant qu'ingénieur, et il était assez patient pour vraiment investir là-dedans.

Petite anecdote : j'étais le premier employé en CDI chez Overflow. Jusque-là, tout le monde était freelance ou à temps partiel. Donc c'était un rôle de « premier de la classe », et un vrai changement de culture par rapport à Seido — où j'étais une machine d'ingénierie à moi tout seul.

S'il fallait résumer la différence entre Seido et Overflow en une phrase : à Seido j'ai appris à *construire*, et chez Overflow j'ai appris à *bien* construire.

Les choses que j'ai apprises chez Overflow se sont accumulées vite. AWS, pour de bon — CloudFront pour le CDN, S3 pour le stockage, la couche réseau, la conteneurisation, la sécurité avec WAF et Shield. L'observabilité et le monitoring avec Datadog et New Relic. Tout le vocabulaire « haute disponibilité, performant, scalable » est passé de phrases abstraites que je pouvais réciter en entretien à des concepts sur lesquels je pouvais réellement raisonner. Ma toute première mission a été une intégration Slack qui envoyait des listes de candidats recommandés aux recruteurs via un cron — petit en périmètre, mais c'est parti en prod, et j'ai remarqué un truc en le livrant : la communication, dans ce genre de boîte, était une compétence à part entière, au même titre que le code. Savoir expliquer ce que tu faisais et pourquoi, clairement, à l'écrit — c'était respecté au même niveau que le travail technique. Mon japonais parlé n'était toujours pas terrible, mais je me suis appuyé à fond sur l'écrit. J'aime la structure de toute façon, donc cette partie du job me correspondait.

Les features s'enchaînaient. Un produit de blog appelé Offers Magazine. Une fonctionnalité d'analytics dans l'app principale Offers pour afficher les chiffres du funnel par étape, et c'est là que j'ai appris BigQuery et ce que l'agrégation de big data donne vraiment à grande échelle. Des APIs GraphQL. Des heures et des heures de debug. Des dizaines de features sur les deux ans et quelques qui ont suivi — trop pour m'en souvenir individuellement aujourd'hui. Il y a eu des hotfix déployés en urgence et des chasses au bug de dernière minute aussi. Je ne me souviens plus des détails, ce qui est probablement la meilleure chose que je puisse en dire. Je n'ai jamais détruit la base de données. Je prends.

Un retour d'Ohtani-san est arrivé tôt et m'est resté. Je shippais vite. Probablement trop vite. Il m'a pris à part dès mon premier mois et m'a dit de ralentir — de me concentrer plus sur la qualité avant la vélocité. J'ai pris le conseil, et je suis encore content qu'il me l'ait donné.

En dehors du boulot, deux gros trucs se sont passés sur cette période. J'ai rencontré l'amour de ma vie — elle est japonaise — et même si mon japonais s'améliorait clairement dans notre quotidien à deux, je dois être honnête : mon japonais a fait des progrès *énormes* au travail. Le « japonais du boulot » est une bête à part. Quelque part dans cette période, j'ai remarqué que je m'étais mis à rêver en japonais, et ça, c'est le genre de chose qu'on ne peut pas simuler. Je comprenais de plus en plus de choses sans avoir besoin de dégainer un outil de traduction.

Je me suis aussi lancé dans deux ou trois side projects.

Le premier était une extension Chrome pour Axie Infinity — ce jeu NFT où on élève et échange des monstres avec de la cryptomonnaie. J'étais joueur moi-même, et j'avais mis un peu d'argent dedans, donc je connaissais bien l'UI de la marketplace. Un jour j'ai remarqué un truc précis : l'API exposait les *gènes* de chaque Axie, mais le site ne les affichait pas sur les listings. Ces gènes comptaient pour toute personne prenant des décisions sérieuses d'élevage. Du coup j'ai écrit un userscript / extension de style Tampermonkey qui récupérait les gènes depuis l'API et les superposait aux cartes de la marketplace. J'ai posté un lien sur le Discord d'Axie — il y avait des milliers de personnes dedans — et j'ai commencé à voir des centaines de téléchargements par jour. J'ai ajouté un déblocage payant à vie via Stripe. Les gens payaient. Au pic, ça me rapportait autour de 30 \$ par jour. Pas de quoi changer de vie, mais du vrai argent qui arrivait pendant que je dormais, et ça, c'était nouveau pour moi.

Le second était un site pour apprendre le japonais appelé Shirimono — même approche, abonnements Stripe, tout le tralala. Il a plafonné à environ trois utilisateurs payants, et je n'avais pas la bande passante pour continuer à le construire, donc je l'ai fermé. (Note de mai 2026 : j'ai repris Shirimono plus tôt cette année, reconstruit de zéro. Donc celui-là n'est pas vraiment fermé — il a juste fait une longue pause.)

Les deux side projects réunis ne m'ont jamais rendu riche, mais l'expérience de construire, déployer, monétiser et supporter ces produits valait bien plus que l'argent. Le genre de prise en charge full-stack que ces projets imposaient, c'était une formation à part entière.

Au bout d'environ un an chez Overflow, j'ai eu une grosse promotion. Ohtani-san m'a dit que j'étais quelque part autour des 5 % des meilleurs performers de la boîte. Le chiffre exact est peut-être un peu flou dans ma mémoire, mais le moment, lui, ne l'est pas — j'étais sous le choc, et je me suis senti sincèrement apprécié. C'est le genre de sentiment dont je veux bien me souvenir, parce que ce n'est pas le genre de chose qu'on contrôle.

Et puis, au bout de deux ans et demi environ, l'envie de bouger est revenue.

Ce n'était pas un problème avec la boîte ou les gens. C'était juste que je développais sur la même plateforme tous les jours, et je sentais un plafond sur la quantité de nouveau terrain que je défrichais. Je voulais de nouveau *plus*. Une idée s'est formée : et si j'allais dans un cabinet de conseil — un endroit où on m'enverrait sur différents clients, différentes stacks, différents problèmes, en rotation ?

Dire à Ohtani-san que je partais a été l'une des conversations les plus difficiles de ma carrière jusque-là. Et ce n'était pas *une* conversation — c'était plusieurs. On a enchaîné les 1:1 là-dessus, et à chaque fois je sortais de son bureau en me demandant *est-ce vraiment la bonne décision ?* C'est quelqu'un que je respecte énormément, et je le sentais essayer — gentiment, jamais avec insistance — de me garder. Tout le processus s'est étalé sur des mois parce qu'honnêtement, moi non plus je n'avais pas envie que ça se termine.

Même après ma démission officielle, Ohtani-san est resté présent pour moi. Il a continué à se rendre disponible pour des conseils de carrière — et il le fait toujours, des années plus tard — et il m'a réengagé en freelance pour bosser sur quelques nouvelles features de l'app. Le complément de revenus était sympa. Mais bosser 2 à 3 heures après mon job principal, tous les soirs, m'a complètement vidé. J'ai jeté l'éponge au bout d'une quinzaine de jours environ.

Je suis retourné voir le recruteur qui m'avait présenté Overflow au départ et je lui ai demandé s'il connaissait des cabinets de conseil qui faisaient du travail pour des clients externes. Il m'a présenté Monstarlab — un cabinet de conseil global avec des bureaux dans pas mal de pays, et une grosse présence au Japon. L'entretien a été le plus fluide que j'avais jamais passé, et je sentais la différence. Deux ans et demi d'Overflow étaient bien là, dans mes réponses — on a parlé en profondeur de performance backend, d'AWS, de caching, de stratégies pour maintenir une base de données en haute disponibilité sous charge. Je connaissais ce sujet maintenant. À l'aise, pour une fois. Confiant.

J'ai eu l'offre. J'ai accepté.

Prochaine destination : Monstarlab.

---

*Traduit par Claude*
