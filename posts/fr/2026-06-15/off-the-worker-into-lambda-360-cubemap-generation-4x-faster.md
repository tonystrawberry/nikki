---
title: "Sortir du worker, entrer dans Lambda : rendre la génération de cubemaps 360° environ 4× plus rapide"
date: "2026-06-15"
excerpt: "Comment nous avons déplacé une conversion 360°-vers-cubemap gourmande en CPU hors de nos workers Sidekiq partagés vers AWS Lambda, choisi py360convert plutôt que krpano, dimensionné correctement la mémoire Lambda, et obtenu une accélération de bout en bout d'environ 4× avec une latence stable."
author: "Tony Duong"
category: "tech"
categories: ["tech", "work"]
tags: ["aws", "lambda", "sidekiq", "rails", "performance", "spacely", "py360convert", "krpano", "360", "s3"]
coverImage: "/images/blog/2026-06-15/after-architecture.png"
---

> Ceci est la version anglaise d'un article que j'ai initialement publié en japonais sur le blog tech de Spacely : **[360°キューブマップ生成をワーカーからLambdaへ移して約4倍高速化した話](https://tech.spacely.co.jp/entry/2026/06/10/163831)**.

Bonjour, je suis **Tony Duong**, ingénieur backend Rails chez [Spacely](https://corp.spacely.co.jp/). Je travaille au quotidien sur la plateforme Spacely. Cet article explique comment nous avons sorti l'un des jobs les plus sollicités et les plus gourmands en CPU de notre application Rails `spacely_web` — transformer une photo 360° en **cubemap** — de nos workers Sidekiq vers AWS Lambda, et rendu l'expérience de bout en bout environ **4× plus rapide** au passage.

## Qu'est-ce qu'une cubemap, et pourquoi en générons-nous une ?

Lorsqu'un utilisateur téléverse une photo 360° d'une pièce, elle arrive sous la forme d'un unique JPEG **équirectangulaire** — la fameuse image de « sphère dépliée », deux fois plus large que haute. Cette projection est idéale pour le stockage mais coûteuse à afficher en temps réel.

![Un exemple de panorama équirectangulaire : une seule image, deux fois plus large que haute, avec le plafond et le sol étirés et courbés](/images/blog/2026-06-15/panorama-sample.jpg)

*Un panorama équirectangulaire. Remarquez comme le plafond et le sol sont étirés et déformés — toute la pièce à 360° est comprimée dans une seule image rectangulaire.*

Donc avant que la photo puisse être affichée, nous la convertissons en **cubemap** : la même scène re-projetée sur les **six faces d'un cube** — droite, gauche, haut, bas, avant et arrière (`pano_r / pano_l / pano_u / pano_d / pano_f / pano_b`). Voici les six faces produites à partir du panorama ci-dessus :

|  |  |  |
|:--:|:--:|:--:|
| ![face avant](/images/blog/2026-06-15/pano_f.jpg)<br/>Avant (`pano_f`) | ![face droite](/images/blog/2026-06-15/pano_r.jpg)<br/>Droite (`pano_r`) | ![face arrière](/images/blog/2026-06-15/pano_b.jpg)<br/>Arrière (`pano_b`) |
| ![face gauche](/images/blog/2026-06-15/pano_l.jpg)<br/>Gauche (`pano_l`) | ![face haut](/images/blog/2026-06-15/pano_u.jpg)<br/>Haut (`pano_u`) | ![face bas](/images/blog/2026-06-15/pano_d.jpg)<br/>Bas (`pano_d`) |

*La même pièce sous forme de six faces carrées non déformées. Contrairement à l'image équirectangulaire étirée, chaque face est une photo plate normale — exactement ce qu'un GPU veut plaquer sur un cube.*

Ces six faces sont ce que le **lecteur de panorama affiche réellement**. Le visualiseur les plaque sur l'intérieur d'un cube autour de la caméra, et lorsque vous faites glisser pour regarder autour d'une pièce, vous regardez ces faces plates — que les GPU peuvent échantillonner bien plus économiquement qu'une image équirectangulaire déformée. Chaque visite 360° que vous parcourez sur Spacely est dessinée à partir d'une cubemap générée par ce job.

> Vous pouvez explorer le lecteur 360° de Spacely ici : **https://info.spacely.co.jp/realestate-vr/**.

Cette conversion s'exécute des milliers de fois par jour, et elle se trouve directement sur le chemin de téléversement — sa vitesse est donc quelque chose que les utilisateurs ressentent directement.

## Le problème : un job gourmand en CPU partageant le pool Sidekiq

L'ancien job, `CreateCubeMapJob`, exécutait la conversion [**krpano**](https://krpano.com/) 1.1x, gourmande en CPU, entièrement sur le worker Sidekiq, puis téléversait les résultats vers S3.

<p align="center"><img src="/images/blog/2026-06-15/before-flow.png" alt="Before flow: Sidekiq worker runs krpano conversion and uploads to S3; then the panorama player renders the faces" width="520"></p>

Trois choses rendaient cela pénible :

1. **Cela affamait tout le reste.** La conversion est gourmande en CPU, et elle s'exécutait sur les mêmes workers Sidekiq que le reste de nos jobs. Un seul projet Spacely peut contenir jusqu'à **50 panoramas**, donc lorsqu'un utilisateur téléversait un projet complet d'un coup, des dizaines de ces jobs s'exécutaient en parallèle, saturaient le CPU, et ralentissaient des jobs *sans rapport* pendant que la file d'attente s'engorgeait. Sidekiq a des limites pratiques de scaling, donc les pics de téléversement se transformaient en pics de latence.

2. **Son temps d'exécution était imprévisible.** Parce que le job partageait les workers avec tout le reste, la durée d'une seule conversion dépendait entièrement du nombre d'autres jobs de cubemap — et d'autres jobs gourmands en CPU — qui se trouvaient s'exécuter au même moment. Lorsque les workers avaient de la capacité disponible, cela se terminait rapidement (environ 5 à 10 secondes) ; en période de forte activité, la même conversion pouvait prendre jusqu'à environ 2 minutes.

3. **krpano 1.1x était en retard sur une mise à jour.** C'est une version de 2019. Nous espérions qu'une bibliothèque plus récente aiderait, mais sous une charge concurrente réaliste (ci-dessous) les gains étaient négligeables.

![Before architecture: an ECS Sidekiq service whose tasks are saturated by CPU-heavy krpano cubemap jobs, with unrelated jobs waiting behind them](/images/blog/2026-06-15/before-architecture.png)

*Lors d'un pic, les jobs krpano gourmands en CPU (orange) saturent chaque tâche Sidekiq, et les jobs sans rapport (gris) attendent leur tour — c'est pourquoi à la fois le travail de cubemap et le travail non-cubemap ralentissaient.*

## La fausse solution tentante : simplement scaler davantage

La première réaction évidente est de jeter du matériel sur le problème : donner aux workers Sidekiq des CPU plus puissants (scaling vertical) et en faire tourner davantage (scaling horizontal). Cela achète effectivement de la marge, et cela vaut la peine de le faire jusqu'à un certain point — mais cela ne corrige pas réellement le problème. La conversion est toujours en concurrence pour les mêmes workers que tous les autres jobs, donc dès que la charge dépasse la nouvelle capacité que nous avons provisionnée, nous revenons à la même contention et aux mêmes temps d'exécution imprévisibles. Le scaling éloigne le mur ; il ne nous écarte pas du mur.

La meilleure solution est architecturale — et pas une solution spectaculaire. Au lieu de réécrire la logique, nous **déléguons la partie lourde à l'environnement conçu pour elle**. La conversion coûteuse, gourmande en CPU, a sa place sur du calcul isolé et à la demande (Lambda), pas sur un pool de workers partagé avec des jobs sensibles à la latence. Surtout, nous avons fait cela tout en gardant l'*interface* identique : le nouveau job a les **mêmes entrées et les mêmes effets de bord** que l'ancien — il lit la même source et écrit les mêmes six faces au même endroit dans S3. Garder le contrat inchangé est ce qui nous a permis de remplacer l'implémentation avec la certitude que le rayon d'impact reste minimal : rien en aval ne peut dire quel job a produit la cubemap.

Le reste de cet article est constitué des deux moitiés de ce changement — évaluer les moteurs de conversion, et déplacer le travail hors du worker.

## Évaluer les moteurs de conversion

Nous avons benchmarké trois moteurs de conversion : notre **krpano 1.1x** actuel (2019), une [**krpano 1.2x**](https://krpano.com/download/) plus récente (2025), et la bibliothèque Python open-source [**py360convert**](https://github.com/sunset1995/py360convert). Le test simulait un pic réaliste : **50 images téléversées d'un coup** (50 jobs Sidekiq mis en file dans une courte fenêtre). L'infrastructure était inchangée — même serveur ECS qui héberge Sidekiq, mêmes CPU et mémoire — seule la bibliothèque de conversion différait. Résultats par image (p50 = médiane) :

| Moteur          | p50    | p95    |
| --------------- | ------ | ------ |
| krpano 1.1x     | 19.6s  | 39.4s  |
| krpano 1.2x     | 17.6s  | 55.5s  |
| py360convert    | 21.4s  | 38.3s  |

**Il n'y a eu aucune amélioration notable** en changeant simplement de bibliothèque. Les trois ont atterri dans la même fourchette sous charge concurrente — la contention CPU due à l'exécution de dizaines de conversions sur des workers Sidekiq partagés éclipsait toute différence de vitesse entre moteurs. Cela ne suffit pas encore pour désigner un gagnant. Voyons comment les performances changent lorsque nous changeons l'architecture sous-jacente.

## La nouvelle conception : déléguer à Lambda

Nous avons déplacé la conversion dans une **AWS Lambda** : un environnement isolé, à scaling horizontal, où 50 conversions concurrentes se comportent exactement comme une seule.

Le nouveau job, `CreateCubeMapV2Job`, **orchestre** le travail — Sidekiq reste léger pendant que chaque conversion s'exécute dans sa propre Lambda isolée. Les octets des images transitent directement entre S3 et Lambda ; le worker ne les manipule jamais.

![After architecture: a light Sidekiq orchestrator with spare CPU and other jobs running, fanning out to isolated per-image Lambdas, with image bytes flowing directly between S3 and Lambda](/images/blog/2026-06-15/after-architecture.png)

*Le worker coordonne ; chaque conversion obtient sa propre Lambda. Les données d'image restent hors de Sidekiq :*

<p align="center"><img src="/images/blog/2026-06-15/after-flow.png" alt="After flow: Sidekiq copies to S3, builds presigned URLs, and invokes Lambda; Lambda fetches via presigned GET, converts, and uploads via presigned PUTs; then the panorama player renders the faces" width="520"></p>

**Aucun octet ne passe par le worker.** Le job effectue une copie S3 côté serveur, puis remet à Lambda des **URLs présignées** : un GET pour lire la source et des PUT pour écrire chaque sortie. Les données d'image vont S3 → Lambda → S3 directement.

## Benchmarker les moteurs sur Lambda

La contention CPU disparue, nous avons réexécuté le **même test de pic de 50 images** sur Lambda — cette fois en comparant **krpano 1.2x** et **py360convert** (nous avons sauté krpano 1.1x et testé avec la bibliothèque plus récente à la place). Chaque conversion s'exécutait dans sa propre Lambda isolée (2048 Mo) ; seule la bibliothèque de conversion différait. Résultats par image (p50 = médiane) :

### 5K (5376×2688)

| Moteur          | p50    | p90    |
| --------------- | ------ | ------ |
| krpano 1.2x     | 6.99s  | 8.33s  |
| **py360convert**| **5.71s** | 10.95s |

### 11K (11008×5504)

| Moteur          | p50     | p90     |
| --------------- | ------- | ------- |
| krpano 1.2x     | 21.26s  | 25.17s  |
| **py360convert**| **10.24s** | 16.44s |

*Mesuré à 2048 Mo. Pour les deux moteurs en 11K, augmenter la mémoire et le vCPU de Lambda au-delà n'améliorait pas les performances — 2048 Mo était le point optimal.*

Comparez cela au tableau Sidekiq ci-dessus — où chaque moteur atterrissait dans la fourchette d'environ 18 à 21s indépendamment de la bibliothèque. Deux conclusions :

1. **Le changement d'architecture était le gain critique.** Le passage des workers partagés à des Lambda isolées a réduit les temps par image d'environ 18 à 21s à quelques secondes en 5K. Le choix de bibliothèque seul sur Sidekiq n'avait quasiment rien changé ; l'isolation l'a fait.

2. **Sur Lambda, `py360convert` est le gagnant net — et l'écart grandit avec la résolution.** En 5K, il est légèrement plus rapide que krpano 1.2x (5.71s contre 6.99s en p50). En 11K, l'avantage double à peu près (10.24s contre 21.26s en p50).

Nous avons choisi **`py360convert`** pour la production. C'est l'option la plus rapide là où cela compte le plus — nos grands panoramas — et c'est une bibliothèque purement Python sans binaire externe ni licence à gérer. Avec les images de sortie générées à la même résolution (de face de cube), la qualité était visuellement indiscernable entre les deux moteurs.

**La conversion elle-même** — l'appel `py360convert` à l'intérieur de notre handler Lambda :

```python
def _convert_faces(image: Image.Image, face_width: int = None) -> Dict[str, Image.Image]:
    np_img = np.array(image)

    ...

    faces = py360convert.e2c(np_img, face_w=face_width, cube_format="dict")

    ...
```

## Ajuster la mémoire Lambda pour py360convert

Sur Lambda, le réglage de la mémoire est en réalité un curseur de performance, pas seulement de capacité — plus de mémoire s'accompagne de [proportionnellement plus de CPU](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html) (et à 1 769 Mo, une fonction obtient l'équivalent d'un vCPU complet). Il n'y a donc pas de valeur unique correcte : trop peu et les grands panoramas manquent de mémoire ; trop et nous payons pour une marge qui n'achète aucune vitesse supplémentaire. Nous avons benchmarké **chaque taille d'image sur une plage de réglages de mémoire** pour trouver son point optimal.

Pour un panorama 5376×2688, nous avons testé de 1024 Mo jusqu'à 4096 Mo :

| Mémoire Lambda | p50    | p90     |
| ------------- | ------ | ------- |
| 1024 Mo       | 9.10s  | 15.48s  |
| **2048 Mo**   | **5.71s** | 10.95s |
| 4096 Mo       | 5.97s  | 10.69s  |

Les performances s'améliorent nettement de 1024→2048 Mo, puis s'aplatissent — 4096 Mo n'est pas plus rapide que 2048. La même forme se vérifie pour un panorama plus grand 11008×5504 (~60 MP), sauf que là, 1024 Mo n'est même pas viable :

| Mémoire Lambda | p50           | p90     |
| ------------- | ------------- | ------- |
| 1024 Mo       | manque de mémoire | —       |
| **2048 Mo**   | **10.24s**    | 16.44s  |
| 4096 Mo       | 10.12s        | 16.94s  |

![Line chart of py360convert conversion time (p50) versus Lambda memory. For 5376×2688, time drops from 9.10s at 1024 MB to 5.71s at 2048 MB, then stays flat at 5.97s at 4096 MB. For 11008×5504, 1024 MB runs out of memory, then 10.24s at 2048 MB and 10.12s at 4096 MB. A dashed line marks 2048 MB as the sweet spot.](/images/blog/2026-06-15/lambda-memory-vs-time.png)

Les deux courbes plient au même endroit : le temps chute fortement jusqu'à 2048 Mo, puis devient plat — la mémoire supplémentaire (et le CPU qui l'accompagne) n'est plus le goulot d'étranglement.

À retenir : **2048 Mo est le point optimal pour nos panoramas typiques**, avec des paliers plus grands gardés en réserve pour les entrées surdimensionnées. En production, `CreateCubeMapV2Job` route selon le nombre de pixels vers l'un des trois endpoints Lambda — **même code de handler**, taille de mémoire différente :

<p align="center"><img src="/images/blog/2026-06-15/lambda-routing.png" alt="CreateCubeMapV2Job routes by pixel count to three Lambda functions (2048 MB, 3072 MB, 4096 MB), each running the same py360convert handler code" width="520"></p>

*Règles de routage : ≤ 11K → 2048 Mo · ≤ 16K → 3072 Mo · > 16K → 4096 Mo. Chaque image obtient assez de mémoire pour s'exécuter ; aucune ne paie pour une marge qu'elle ne peut pas utiliser.*

### Coût

Même au pic, la facture reste modeste. Lors d'une journée chargée, nous exécutons de l'ordre d'environ 19 000 conversions (~570 000/mois). À 2048 Mo et environ 17s de durée moyenne, dans la région de Tokyo ([tarification Lambda](https://aws.amazon.com/lambda/pricing/)) :

- **Calcul :** 570 000 × 2 Go × 17s = 19 380 000 Go-secondes × \$0.0000166667 ≈ **\$323/mois**
- **Requêtes :** 570 000 × \$0.20 / 1M ≈ **\$0.11/mois**
- Plus quelques dollars d'[API Gateway](https://aws.amazon.com/api-gateway/pricing/).

Donc l'ensemble atterrit à **environ \$350/mois dans le pire des cas** — un prix juste pour sortir une charge de travail lourde et en pics du pool de workers partagé et obtenir en retour une latence stable et prévisible.

## Résultats

Nous avons testé le pire cas réaliste — **un projet complet de 50 grands panoramas (11008×5504) téléversés d'un coup** (50 étant le maximum qu'un projet peut contenir), sur une infrastructure aux spécifications de production — en mesurant du téléversement jusqu'à un lecteur prêt à l'emploi :

| Pipeline                              | Bout en bout |
| ------------------------------------- | ---------- |
| Sidekiq + krpano 1.1x (avant)        | ~8m 50s    |
| Lambda + krpano 1.2x                  |            |
| **Lambda + py360convert (après)**     | **~1m 50s** |

Une **accélération d'environ 4×** de bout en bout — et tout aussi important, les chiffres de Lambda sont *stables*. Sur Sidekiq, le temps des jobs variait énormément selon l'occupation des workers ; sur Lambda, l'exécution isolée signifie que 50 jobs concurrents se terminent à peu près dans le même temps qu'un seul.

Nous déployons cela progressivement derrière un **feature flag par entreprise** — un déploiement par phases plutôt qu'un canary à répartition de trafic : nous activons le nouveau chemin entreprise par entreprise, pas requête par requête.

<p align="center"><img src="/images/blog/2026-06-15/rollout-phases.png" alt="Three-phase rollout: Phase 1 limited release with feature flag routing selected companies to Lambda and others to Sidekiq while monitoring cost; Phase 2 all companies on Lambda; Phase 3 delete legacy CreateCubeMapJob and krpano tooling" width="680"></p>

1. **Release limitée** — activer le flag pour un sous-ensemble d'entreprises ; surveiller les performances et le coût pendant que les autres restent sur Sidekiq + krpano 1.1x.
2. **Toutes les entreprises** — activer Lambda + py360convert partout.
3. **Nettoyage** — une fois que le nouveau chemin a fait ses preuves, supprimer entièrement l'ancien job krpano et son outillage.

## À retenir

- **Déplacez le travail gourmand en CPU et en pics hors de votre pool de workers partagé.** Le gain critique était l'isolation architecturale — pas le changement de bibliothèque sur Sidekiq. Une fois sur Lambda, **`py360convert`** a pris l'avantage, surtout sur les grands panoramas (11K).
- **Gardez le worker distant léger et passez-lui des URLs présignées.** Lambda lit et écrit S3 directement — les octets des images ne passent jamais par vos serveurs applicatifs.
- **Dimensionnez correctement le calcul distant en fonction de l'entrée.** Sélectionner le palier de mémoire Lambda d'après le nombre de pixels de la source a évité à la fois les échecs par manque de mémoire sur les énormes panoramas et le surpaiement sur les petits.

---

Nous recrutons des ingénieurs chez Spacely. Si ce type de travail backend vous intéresse, consultez notre [page recrutement](https://corp.spacely.co.jp/recruit/).

---

> 🌐 *Traduit par Claude*
