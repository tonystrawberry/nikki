---
title: "Chapitre 4 : Apprendre à diriger"
date: "2026-06-09"
excerpt: "Monstarlab — un cabinet de conseil global, un bureau en télétravail à Enoshima, un client différent à chaque fois. Un Noël passé à récupérer des données de production, une pile de certifications AWS, un chatbot construit en Terraform, une promotion au poste de Tech Lead, et huit ingénieurs à Da Nang qui m'ont appris ce que diriger coûte vraiment."
author: "Tony Duong"
category: "note"
categories: ["work", "reflections"]
tags: ["career-story", "career", "personal", "japan", "tokyo", "monstarlab", "aws", "leadership"]
coverImage: ""
collection: "career-story"
collectionOrder: 4
collectionTitle: "Histoire de ma carrière"
---

J'ai déjà raconté à quel point ça avait été difficile de quitter Overflow. Ce que je n'ai pas dit, c'est qui je laissais derrière moi. Keita, Matsun, Fujikawa-san, Tabito-san — merci. Pour ces années, et pour m'avoir fait confiance dès le départ, à l'époque où j'étais persuadé d'avoir raté l'entretien avec mon niveau immature et mon japonais bancal. Il a fallu trois 1:1 avec Tabito-san avant que je puisse vraiment me décider à partir, et quand j'ai fini par l'annoncer à l'équipe, j'ai ressenti une tristesse sincère. Deux ans sur le même projet, ça fait ça. On ne remarque les racines qu'au moment où on essaie de les arracher.

La recherche d'emploi en elle-même a été courte. Deux entretiens. L'un était dans une startup fintech, et je l'ai complètement loupé — le rôle était full-stack avec une orientation frontend, et même après deux ans de Vue.js chez Overflow, mes connaissances en frontend étaient plus minces que je ne l'aurais voulu. Pas grave. On découvre vite où sont ses limites.

L'autre, c'était Monstarlab.

Un gros cabinet de conseil avec des bureaux éparpillés partout dans le monde, et le rôle était Senior Backend — beaucoup plus dans mes cordes. L'entretien a été le genre de conversation que j'espérais discrètement avoir depuis un moment. L'intervieweur était l'EM de l'époque, et on a fini plongés dans du system design : CDN, caching, read replicas, stratégies de load-balancing. On a passé en revue l'exercice de code que j'avais rendu, une petite application Rails. Pour une fois, je n'allais pas chercher du vocabulaire à moitié mémorisé — j'avais réellement vécu tout ça pendant deux ans et demi chez Overflow, et je le sentais. J'ai eu l'offre, avec un gros bond de salaire en prime.

Si Seido est l'endroit où j'ai appris à *construire*, et Overflow celui où j'ai appris à *bien* construire, alors Monstarlab est l'endroit où j'ai appris à construire *avec d'autres* — et, à terme, à les diriger.

## Un autre genre d'entreprise

Monstarlab prend des projets auprès de clients, ce qui veut dire que les ingénieurs sont assignés à différents projets. Donc même si j'appartenais à l'équipe backend, on ne travaillait souvent pas vraiment *ensemble*. C'est la seule chose qui me dérangeait sincèrement. Il y avait tellement de collègues — des amis, en fait — avec qui je voulais construire quelque chose et avec qui je n'en ai jamais eu l'occasion, parce qu'on était toujours aux deux extrémités de projets clients différents. C'est comme ça que fonctionne le conseil. On fait avec.

Presque tout le reste, je l'ai adoré. Le rôle était en télétravail, et je m'y suis pleinement engouffré. Je vivais à Enoshima à ce moment-là — magnifique, mais loin du bureau de Tokyo, donc j'y allais peut-être deux ou trois fois par mois. Toujours une bonne journée quand je le faisais. (J'ai même donné une petite présentation sur la France lors d'une soirée vin de l'entreprise, une fois. Posez-moi des questions sur le vin, pas sur la prise de parole en public.)

Et voici une chose dont je n'avais pas anticipé l'importance : environ la moitié des ingénieurs étaient étrangers. Chez Overflow, j'avais été le seul — l'unique non-Japonais à apprivoiser le japonais professionnel en temps réel. Chez Monstarlab, je n'étais plus l'exception, et ça a fait retomber une pression silencieuse dont je ne m'étais même pas rendu compte que je la portais.

## Le premier projet, et un Noël dont je me souviendrai

Mon premier projet était pour un grand constructeur automobile japonais — un nom que tout le monde connaît. J'ai rejoint en cours de route, donc les fondations étaient déjà posées. Ingénieur backend, Ruby côté serveur, ce qui voulait dire que j'étais à l'aise dès le premier jour et que je pouvais plonger directement dedans. Honnêtement, ce n'était pas un projet difficile. C'est précisément pour ça que j'ai décidé de le faire *vraiment* bien.

Au bout de trois mois, quelques membres ont quitté l'équipe, et je me suis retrouvé backend lead. Le projet s'est bouclé environ six mois plus tard sans grand drame.

Enfin — un seul petit drame. J'ai travaillé à Noël cette année-là. Une mauvaise communication de ma part m'a conduit à lancer une tâche qui a écrasé des données de production. Le bon genre d'erreur, finalement, parce que la sortie de crise consistait à apprendre le Point-in-Time Recovery d'Aurora sur le bout des doigts, sous exactement le genre de pression qui fait que la leçon reste gravée. Je n'ai plus jamais regardé une tâche de production de la même façon depuis. *Joyeux Noël.*

Après ça, le projet est entré en phase de maintenance, de nettoyage et de passation — calme. Alors j'ai mis le calme à profit.

## Aller en profondeur sur AWS

J'avais déjà pas mal touché à AWS chez Overflow, mais presque tout avait une forme orientée web : EC2, ECS, RDS, S3, SQS, la couche réseau avec ALB et VPC, CloudFront, WAF, Redshift. J'en savais assez pour être utile. Je voulais en savoir assez pour être dangereux. AWS est une plateforme avec laquelle j'aime sincèrement travailler, et je voulais aller plus loin du côté infrastructure, pas seulement du côté applicatif.

Alors j'ai plus ou moins harcelé l'EM jusqu'à ce qu'il me place sur un projet d'infra AWS. Merci Serigne — l'une des personnes les plus adorables avec qui j'aie jamais travaillé — d'avoir rendu ça possible.

Le projet suivant était pour l'un de ces conglomérats japonais qui sont dans *tout* — banque, e-commerce, télécoms, et j'en passe. J'ai travaillé aux côtés de l'ingénieur IA pour construire un chatbot propulsé par ChatGPT avec du RAG — pas si différent du petit assistant de chat que j'ai ensuite construit pour ce blog. C'est là que j'ai mis les mains sur Amazon Lex et Amazon Connect, et une poignée d'autres services que j'ai depuis à moitié oubliés, le tout provisionné avec Terraform. Il a fallu quelques semaines pour monter le prototype, entièrement en Terraform, et j'ai adoré ce passage de travail — il y a quelque chose de profondément satisfaisant à décrire tout un système en code et à le voir se matérialiser. Le hic : ça n'a jamais été qu'un prototype. Mais l'apprentissage, lui, était bien réel.

Monstarlab proposait aussi un soutien financier pour les certifications AWS, alors j'y suis allé à fond et j'ai bossé dur. J'en suis ressorti avec environ sept. Les gens sont parfois un peu dédaigneux vis-à-vis des certifs, et je comprends — mais ce socle théorique a payé encore et encore depuis, de façons que je n'avais pas anticipées à l'époque. Plein de choses *cliquent* maintenant, là où il n'y avait que du brouillard.

Au bout d'environ un an, j'ai eu un gros bond : promu **Tech Lead**. Le feedback parlait de ma contribution et de mon attitude proactive et positive sur les projets — je ne me souviens pas des mots exacts, mais je me souviens de la sensation. Apprécié.

## Le plus dur

Le troisième projet a été le plus long et le plus dur de mon passage là-bas. Backend lead sur un build important pour une autre grande entreprise, à partir de zéro, avec un planning serré et *beaucoup* à livrer. Avec le recul, c'était sincèrement énorme pour le temps dont on disposait.

L'architecture m'était nouvelle, et j'en suis ressorti conquis. Trois couches : un frontend qui parle à un **BFF** via GraphQL, et le BFF qui parle à un backend **Ruby on Rails** via gRPC. Le tout était **schema-first** — on définissait le contrat dans des fichiers proto, et le code côté BFF comme côté backend était généré à partir de ce schéma. Ça voulait dire que les couches ne pouvaient pas dériver discrètement les unes des autres : on change le schéma, on régénère, et le compilateur te dit exactement ce que tu as cassé. Je n'avais jamais construit de cette façon, et ça marchait vraiment bien.

Une fonctionnalité que j'étais particulièrement fier d'avoir construite était un système de réservation. « Réserver un créneau », ça paraît simple ; ça ne l'est pas. Il s'intégrait à Google Calendar pour vérifier la disponibilité et réserver effectivement le créneau, et il reposait sur un enchevêtrement de règles côté application — rôles, attribution intelligente des participants, l'ensemble des horaires possibles — qui devaient toutes s'accorder avant qu'une réservation puisse aboutir. Faire en sorte que toutes ces contraintes s'alignent proprement, c'était le genre de problème que j'aime : petit en surface, profond une fois qu'on est dedans.

Une autre fonctionnalité que j'ai été content de construire, c'était l'analytics — agréger une grande quantité de données pour afficher des vues quotidiennes, hebdomadaires et sur trois mois. J'ai opté pour **Google BigQuery**, une base de données OLAP parfaitement adaptée à ce genre de travail. Mon passage chez Overflow a payé ici : j'avais déjà conçu et construit quelque chose de très similaire, donc je connaissais la forme du problème avant même de commencer. Un job d'agrégation tournait une fois par jour dans la base OLAP, et ses résultats étaient chargés dans la base OLTP — ce qui gardait les requêtes de lecture sur les données agrégées bien rapides. Ça a marché sans accroc.

Je gérais huit ingénieurs backend, tous issus de notre bureau du Vietnam. Il y avait aussi un backend lead de leur côté, qui m'a été d'une aide précieuse (un clin d'œil à toi, Tien). Une bonne partie de l'équipe était composée de juniors, mais on sentait l'*envie* en eux — la volonté d'apprendre, de bien faire les choses. Et j'ai toujours aimé avoir les mains dans le cambouis, surtout à l'époque, quand on écrivait encore le code à la main. Donc en plus du travail de tech lead, je me suis retrouvé dans le code à leurs côtés.

C'est là que j'ai vraiment dû apprendre à équilibrer la qualité face au temps — pas comme un slogan, mais comme une décision quotidienne avec un délai serré qui pousse derrière. À un moment, les PMs ont évoqué l'idée d'ajouter plus de développeurs backend pour accélérer. J'ai poussé en sens inverse. On avait déjà huit personnes plus moi, et mon instinct me disait que plus de bras nous ralentiraient, au lieu de nous accélérer. (Je n'avais pas le nom pour ça à l'époque, mais j'avais réinventé la loi de Brooks de l'intérieur.)

Chaque journée, sans exception, était pleine. *Dense* est le mot — compact, tassé, sans le moindre mou. Ce qui rendait ça supportable, c'étaient les gens. Ils étaient tellement chaleureux que la pression ne s'est jamais transformée en misère. On s'est même envolés au Vietnam pour un voyage d'affaires, où j'ai pu pratiquer un peu mon vietnamien, manger extraordinairement bien — l'hospitalité vietnamienne, c'est autre chose, ils ne vous laisseront pas avoir faim — taper dans un ballon de foot, et caser un footing matinal le long de la plage à Da Nang. On construit un autre genre d'esprit d'équipe quand on a couru sur le même sable.

Le client était strict et plaçait la barre très haut, et aussi stressant que ça ait pu devenir, c'est exactement ce qui m'a fait progresser — pas seulement techniquement, mais aussi du côté soft-skills, gestion d'équipe, ce muscle que je n'avais jamais vraiment eu à solliciter avant. Et on a tenu la release. La dernière semaine a été brutale — je me souviens d'être allé en personne dans les bureaux du client pour peaufiner le build final, quelques nuits blanches enchaînées coup sur coup — mais on l'a livré. Beau boulot, tout le monde. Je le pense sincèrement.

## Le tournant, encore une fois

Deux ans et demi sont passés, et la même vieille sensation est revenue : je n'avais pas encore trouvé mon statu quo. Ce n'est pas que quelque chose n'allait pas. Je n'ai que de bons souvenirs de Monstarlab — les projets, les dîners, les collègues, dont plusieurs que je revois encore régulièrement en dehors du travail. Mais cette envie d'ailleurs est honnête, et j'ai appris à lui faire confiance.

Alors j'ai sauté le pas vers là où je suis aujourd'hui : **Spacely**. Trouvé sur LinkedIn, postulé, accepté.

Mais ça, c'est une nouvelle page — et je vous la raconterai dans le prochain chapitre.

---

## Réalisations

Un récapitulatif plus concret de ce que j'ai fait pendant mon passage chez Monstarlab :

- **Rejoint en tant que Senior Backend Engineer** (Ruby) avec un net élargissement de périmètre et de salaire, et **promu Tech Lead** environ un an plus tard.
- **Pris le rôle de backend lead** sur un projet pour un grand constructeur automobile japonais quand des coéquipiers ont quitté l'équipe, et mené le projet jusqu'à la livraison sur environ six mois.
- **Récupéré des données de production écrasées grâce au Point-in-Time Recovery d'Aurora** après une erreur de déploiement — et appris la discipline qui garantit que ça ne se reproduise jamais.
- **Construit un prototype de chatbot RAG propulsé par ChatGPT** pour un grand conglomérat japonais, en travaillant aux côtés d'un ingénieur IA avec Amazon Lex et Amazon Connect, entièrement provisionné en Terraform.
- **Obtenu environ sept certifications AWS** grâce au soutien aux certifications de Monstarlab — un socle théorique qui a porté ses fruits depuis.
- **Dirigé une équipe backend de huit ingénieurs** répartie entre les bureaux de Tokyo et du Vietnam sur un build from-scratch pour un client exigeant aux standards élevés, en équilibrant la qualité face à un planning serré et en livrant la release dans les temps.
- **Travaillé dans une architecture schema-first à trois couches** — un BFF GraphQL entre le frontend et un backend Ruby on Rails en gRPC, avec du code généré côté BFF comme côté backend à partir de schémas proto partagés — une façon de construire que je n'avais jamais utilisée et que j'ai fini par beaucoup apprécier.
- **Construit un système de réservation intégré à Google Calendar** (vérification de disponibilité et réservation de créneaux) par-dessus des règles complexes côté application — rôles, attribution intelligente des participants, et ensembles contraints d'horaires possibles devant tous s'accorder avant qu'une réservation puisse aboutir.
- **Construit une fonctionnalité d'analytics sur Google BigQuery** (OLAP) qui agrégeait de gros volumes de données en vues quotidiennes, hebdomadaires et sur trois mois — un job d'agrégation quotidien dans la base OLAP chargeait les résultats dans la base OLTP pour garder les lectures rapides, en m'appuyant sur un travail similaire mené chez Overflow.

---

> 🌐 *Traduit par Claude*
