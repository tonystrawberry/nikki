---
title: "Entretien de system design : concevoir Dropbox ou Google Drive avec un ancien Staff Engineer de Meta"
date: "2026-06-11"
excerpt: "Le déroulé de Hello Interview pour concevoir Dropbox / Google Drive — uploads par presigned URL directement vers S3, chunking avec fingerprints pour des uploads reprenables, et synchronisation via polling, delta sync et réconciliation."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["system-design", "dropbox", "google-drive", "file-storage", "s3", "chunking", "fingerprinting", "interview", "distributed-systems"]
coverImage: ""
youtubeUrl: "https://www.youtube.com/watch?v=_UZ1ngy-kOI"
---

Encore un épisode de la série system design de Hello Interview, animée par Evan (ancien staff engineer et recruteur chez Meta, qui a posé cette question environ 50 fois). **Concevoir Dropbox** — aussi posée sous la forme « Concevoir Google Drive » — est populaire chez Google, Amazon et Meta. Elle est plutôt **du côté facile**, posée le plus souvent à des candidats de niveau intermédiaire (E4/L4) mais aussi senior et staff, où ce sont les deep dives qui font la différence entre les niveaux.

La feuille de route réutilisable : **exigences → entités principales → API → conception de haut niveau → deep dives**.

## Exigences

- **Fonctionnelles** : uploader un fichier (vers le stockage distant), télécharger un fichier, et **synchroniser automatiquement les fichiers entre appareils** (un dossier local reflète le distant, dans les deux sens). *Hors périmètre : développer son propre blob storage — « Concevoir S3 » est une question à part.*
- **Non fonctionnelles** : privilégier la **disponibilité plutôt que la cohérence** (CAP) — ce n'est pas grave si quelqu'un aux États-Unis voit brièvement une ancienne version d'un fichier modifié en Allemagne ; des uploads/downloads **à faible latence** ; la prise en charge de **gros fichiers jusqu'à 50 Go** avec des **uploads reprenables** ; et une **forte intégrité des données** (la cohérence à terme est acceptable, mais une fois stabilisée, le local et le distant doivent correspondre).

> Une parenthèse pédagogique : ne faites pas d'estimations « back-of-the-envelope » d'entrée de jeu ici. N'estimez que lorsque les chiffres vont **directement changer votre conception** — et avec un blob storage quasi infiniment scalable, ce ne sera généralement pas le cas.

## Entités principales

- **File** — les octets bruts, stockés dans le blob storage (S3).
- **FileMetadata** — l'ID du fichier, son nom, son type MIME, sa taille, l'ID du propriétaire (FK vers l'utilisateur), et le lien S3 vers les octets.
- **User** — la moins importante ; parfois une distraction qu'il vaut mieux laisser de côté au début.

## API

- `POST /files` — le corps contient le fichier + les métadonnées ; renvoie 200.
- `GET /files/{fileId}` — renvoie le fichier + les métadonnées.
- `GET /changes?since={timestamp}` — renvoie la liste des IDs de fichiers qui ont changé (plus tard : les métadonnées complètes, pour économiser un aller-retour).

L'ID utilisateur voyage dans le **header** (JWT / token de session), pas dans le corps. Evan signale d'emblée que ces endpoints sont **volontairement « faux »** — le vrai chemin d'upload émerge dans les deep dives, et il y revient pour les corriger.

## Conception de haut niveau

Client → **load balancer / API gateway** (authentification, rate limiting, terminaison SSL, routage) → **File Service**, qui écrit les octets dans le **blob storage (S3)** et les métadonnées dans la **File Metadata DB**. La ligne de métadonnées contient le **lien S3**.

- **Upload** : fichier → File Service → S3, puis écriture des métadonnées, retour 200.
- **Download** : on récupère les métadonnées via l'ID du fichier, on obtient le lien S3, et on **télécharge directement depuis S3** (sans faire transiter les octets de nouveau par le serveur).

### Sync — l'exigence intéressante

Contrairement à la plupart des conceptions, le **client est « gros »** et mérite d'être modélisé : il contient le **dossier local**, une **application cliente** et une **base de données locale** (métadonnées + fingerprints, pour savoir ce qui est déjà téléchargé). Deux directions :

- **Le distant a changé** → le client interroge périodiquement (**polls**) `GET /changes` et télécharge les fichiers nouveaux/modifiés.
- **Le local a changé** → l'OS notifie via les API natives de surveillance de fichiers (**Windows : FileSystemWatcher**, **macOS : FSEvents**) ; l'application uploade via le chemin normal et met à jour les métadonnées.

## Deep dives

Les deep dives existent pour satisfaire les exigences **non fonctionnelles**.

### Gros fichiers (50 Go) + uploads reprenables

La conception naïve ne fonctionne que pour des fichiers d'environ 5 à 10 Mo, pour deux raisons :

1. **Chemin d'upload redondant** — uploader les octets vers le File Service *puis* vers S3 gaspille de la bande passante et du CPU.
2. **Limites de taille du corps de requête** — les navigateurs/serveurs/gateways plafonnent la taille du corps (l'AWS API Gateway est à environ 10 Mo), donc un fichier de 50 Go ne peut tout simplement pas passer.

**Correction 1 — presigned URLs.** N'envoyez que les **métadonnées** au File Service (en posant `status: started`), puis demandez une **presigned URL** à S3. S3 renvoie un lien signé, limité dans le temps et restreint à ce type MIME et cette taille ; le client **uploade les octets directement vers S3** avec ce lien.

**Correction 2 — chunking.** Un fichier de 50 Go à environ 100 Mbps prend environ 1 h 12, donc ne faites pas repartir un échec de zéro. **Découpez le fichier en chunks côté client** (chunks d'environ 5 Mo), uploadez les chunks vers S3 (en série ou en parallèle), et suivez le statut de chaque chunk dans les métadonnées. Pour identifier les chunks de manière unique, utilisez le **fingerprinting** — un hash des octets du chunk devient l'ID du chunk. Pour reprendre, comparez les fingerprints du client avec la liste des chunks stockés et ré-uploadez uniquement ceux qui manquent. (Modélisé dans DynamoDB sous forme d'une liste `chunks`, chacun avec `{ id: fingerprint, status, s3Link }`.)

**Mettre à jour le statut des chunks en toute sécurité.** Ne faites pas aveuglément confiance à l'affirmation « chunk uploadé » du client — utilisez le principe **trust-but-verify** (faire confiance mais vérifier) : le client signale un succès, puis le File Service **confirme auprès de S3** avant de marquer le chunk comme terminé. Alternative : les **notifications S3** (change data capture) poussent l'événement côté serveur. À noter que le **multipart upload** natif de S3 fait une grande partie de ce travail (chunking, fingerprinting, validation) à votre place.

### Upload/download à faible latence

- **Le chunking aide déjà** — les uploads de chunks en parallèle avec des tailles de chunks adaptatives saturent la bande passante disponible.
- **CDN** — l'ajout évident, mais **réfléchissez avant de l'ajouter** : les utilisateurs téléchargent surtout **leurs propres** fichiers et sont proches de leur propre data center, donc un CDN aide rarement et coûte cher. Il ne vaut le coup que pour les utilisateurs en déplacement ou les fichiers partagés très populaires.
- **Compression** — envoyer moins d'octets, mais **de façon sélective** : le texte/DOCX se compresse bien ; les médias déjà compressés (JPEG/PNG/MP4) gagnent peu et ne valent pas le coût de compression/décompression. Décidez côté client selon le type de fichier + le réseau ; enregistrez l'algorithme dans les métadonnées.

### Forte intégrité des données / précision de la synchronisation

Deux objectifs — **rapide** et **cohérent** :

- **Rapide** : le **polling adaptatif** (interroger plus souvent quand l'app est ouverte / active) bat les WebSockets ou le long-polling, qui sont surdimensionnés pour des « mises à jour en quelques secondes ». Avec en plus le **delta sync** — ne récupérer que les **chunks modifiés** d'un fichier, pas le fichier entier, et laisser le client le ré-assembler.
- **Cohérent** : deux options pour détecter les changements —
  - **Interroger la DB directement** (« donne-moi les fichiers du dossier X avec un chunk modifié depuis ma dernière synchronisation ») — simple, et c'est ce que choisit Evan.
  - **Event bus avec un curseur** (par ex. Kafka) — chaque changement est un événement ; un **curseur de synchronisation** par dossier marque le dernier événement lu. C'est plus proche de ce que fait réellement Dropbox et cela permet **audit trail / versioning / rollback**, mais c'est **surdimensionné** sans ces exigences.
- **Réconciliation** : malgré tous les efforts, le local et le distant peuvent diverger, donc périodiquement (quotidiennement/hebdomadairement) le client récupère l'état distant, compare les fingerprints et corrige les incohérences.

Enfin, il revient pour **corriger l'API** : `POST /files` envoie les *métadonnées* et récupère une **presigned URL** ; le client uploade les **chunks** vers cette URL ; puis met à jour (patch) le statut des chunks — ce qui correspond à ce que les deep dives ont révélé.

## Points clés à retenir

- **Séparez les octets des métadonnées** — coordonnez via le File Service, déplacez les octets **directement vers/depuis S3 via des presigned URLs**.
- **Chunkez + fingerprintez** les gros fichiers — la base pour les uploads reprenables, le parallélisme, l'intégrité et le **delta sync**.
- **Trust but verify** le statut des chunks (ou utilisez les notifications S3) ; le multipart upload de S3 fait une grande partie de ce travail nativement.
- **Sync = polling adaptatif + delta sync**, avec la **réconciliation** comme filet de sécurité ; les WebSockets sont surdimensionnés.
- **Remettez en question le CDN** et **compressez de façon sélective** — les choix par défaut ne sont pas toujours les bons, et savoir expliquer pourquoi, c'est ce qui rapporte des points.
- Justifiez la profondeur selon le **niveau** : un candidat intermédiaire peut s'arrêter après une solide conception de haut niveau ; les seniors/staff doivent mener 2 à 3 deep dives.

---

> 🌐 *Traduit par Claude*
