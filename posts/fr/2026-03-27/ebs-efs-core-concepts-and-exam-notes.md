---
title: "Concepts essentiels EBS et EFS et notes d'examen"
date: "2026-03-27"
excerpt: "Un resume pratique axe examen sur les volumes EBS, les snapshots, les systemes de fichiers EFS et les cas d'usage AWS de chacun."
author: "Tony Duong"
category: "note"
tags: ["aws", "ec2", "ebs", "efs", "storage", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 5
collectionTitle: "AWS CloudOps Engineer - Associate"
---

## Pourquoi ce sujet est important

Les questions sur le stockage EC2 apparaissent souvent dans les examens AWS et dans les operations reelles. L'essentiel est de comprendre quand utiliser le stockage bloc (`EBS`) plutot qu'un stockage de fichiers partage (`EFS`), ainsi que l'impact des snapshots, des fonctions de cycle de vie et des compromis de cout sur les decisions d'architecture.

## Fondamentaux d'EBS

Amazon EBS (Elastic Block Store) est un **volume bloc attache au reseau** pour EC2.

- peut etre attache a des instances EC2 pendant leur execution
- conserve les donnees independamment du cycle de vie de l'instance
- est generalement attache a une seule instance a la fois (sauf cas specifiques de multi-attach)
- est limite a une seule zone de disponibilite (AZ)

Pensez a EBS comme a une cle USB reseau : detachable et reattachable, mais liee a une AZ.

## Attachement EBS et contraintes d'AZ

Comportements operationnels importants :

- un volume EBS cree dans `eu-west-1b` ne peut etre attache qu'aux instances dans `eu-west-1b`
- pour utiliser les donnees dans une autre AZ, creez un snapshot puis restaurez un nouveau volume dans l'AZ cible
- une instance EC2 peut avoir plusieurs volumes EBS
- les volumes peuvent exister sans etre attaches et etre rattaches plus tard a la demande

Cette limite d'AZ est un piege frequent en examen.

## Comportement Delete-on-Termination

Au lancement d'EC2, chaque volume EBS attache dispose du parametre `DeleteOnTermination`.

- volume racine : souvent `true` par defaut
- volumes de donnees additionnels : souvent `false` par defaut

Implication : terminer une instance supprime en general le stockage racine, mais conserve les volumes de donnees non racine sauf configuration contraire.

## Types de volumes EBS (vue utile pour l'examen)

### SSD usage general

- `gp3` : performance de base avec IOPS et debit configurables independamment
- `gp2` : ancien modele ou performance et taille du volume sont plus etroitement liees

A utiliser pour les charges generales, les volumes de demarrage, le dev/test et un bon equilibre prix/performance.

### SSD IOPS provisionnees

- `io1` / `io2` (dont io2 Block Express)
- pour les charges critiques a faible latence et forte regularite (souvent des bases de donnees)
- prend en charge des IOPS tres elevees et des garanties de performance avancees

### Options HDD

- `st1` (HDD optimise pour le debit) : charges avec fort debit sequentiel
- `sc1` (HDD froid) : charges a acces peu frequent au cout minimal

`st1` et `sc1` ne sont pas destines aux volumes de demarrage.

## Snapshots EBS : sauvegarde et mobilite

Les snapshots capturent l'etat d'un volume EBS et constituent le mecanisme de base pour :

- la sauvegarde et la restauration
- la migration inter-AZ (restauration du snapshot dans une autre AZ)
- la copie inter-region pour la reprise apres sinistre
- la creation de copies/volumes chiffres via KMS pendant les workflows de copie/restauration

Bonne pratique : les snapshots sont plus fiables lorsque l'activite d'ecriture est reduite afin d'eviter des problemes de coherence.

## Operations de snapshot et fonctions de cout

### Data Lifecycle Manager (DLM)

Automatise la creation, la retention et le nettoyage des snapshots/AMI via des politiques basees sur les tags.

- planifier des sauvegardes recurrentes
- conserver un nombre fixe de snapshots
- prendre en charge des politiques de copie inter-compte/inter-region

### Fast Snapshot Restore (FSR)

Reduit la latence de premiere lecture sur les volumes restaures en pre-initialisant les blocs.

- utile quand une haute performance immediate est requise apres restauration
- couteux si laisse active en continu
- schema pratique : activer temporairement, restaurer le volume, puis desactiver

### Niveau Snapshot Archive

Deplace les snapshots vers le niveau archive pour reduire le cout de stockage (souvent avec des economies importantes), avec des temps de restauration plus lents (en heures, pas immediats).

### Recycle Bin pour snapshots

Protege contre les suppressions accidentelles via des regles de retention (par exemple de quelques jours a quelques mois avant suppression definitive).

## Fondamentaux d'EFS

Amazon EFS (Elastic File System) est un **systeme de fichiers NFS gere**.

- peut etre monte simultanement depuis de nombreuses instances EC2
- fonctionne sur plusieurs AZ d'une region
- ideal pour les charges a fichiers partages (CMS, contenu web, donnees applicatives partagees)
- oriente Linux (semantique NFS/POSIX)
- facturation a l'usage, capacite qui s'adapte automatiquement

Par rapport a EBS, EFS est generalement plus cher, mais offre un acces fichier partage multi-AZ.

## Modes de performance et de debit EFS

### Modes de performance

- `General Purpose` : latence plus faible, mode par defaut pour de nombreuses applications
- `Max I/O` : debit et parallelisme plus eleves, latence plus forte

### Modes de debit

- `Bursting` : le debit evolue avec la quantite de donnees stockees
- `Provisioned` : objectif de debit defini explicitement
- `Elastic` : ajustement automatique du debit selon la demande (utile pour un trafic imprevisible)

## Classes de stockage EFS et cycle de vie

EFS peut deplacer les fichiers entre differents niveaux via des politiques de cycle de vie :

- `Standard` pour les donnees frequemment accedees
- `EFS-IA` pour l'acces peu frequent
- `Archive` pour les donnees rarement accedees

Un bon reglage du cycle de vie peut reduire fortement les couts de stockage tout en conservant une architecture de fichiers partages.

## Points pratiques a retenir

- EBS apparait parmi les peripheriques bloc EC2 ; les actions d'attachement/detachement sont simples
- une incompatibilite d'AZ empeche l'attachement EBS a l'instance cible
- la terminaison d'EC2 montre immediatement l'impact de `DeleteOnTermination`
- les mount targets/groupes de securite EFS sont critiques pour l'acces inter-AZ
- deux instances dans des AZ differentes peuvent lire/ecrire le meme chemin de fichier monte via EFS

## Guide rapide de decision EBS vs EFS

Utilisez **EBS** quand vous avez besoin de :

- stockage bloc pour une seule instance
- volumes de demarrage
- performance previsible par volume

Utilisez **EFS** quand vous avez besoin de :

- systeme de fichiers partage pour de nombreuses instances Linux
- acces concurrent multi-AZ
- capacite elastique sans pre-provisionner la taille

## Points cles a retenir

- EBS est un stockage bloc limite a une AZ, ideal pour les disques centres sur EC2 et les volumes de demarrage
- les snapshots sont centraux pour les workflows de sauvegarde, migration et reprise apres sinistre
- EFS est un stockage NFS partage et extensible entre AZ pour les charges Linux
- l'optimisation cout/performance depend du bon choix de classe de volume, mode de debit et politique de cycle de vie
- les questions d'examen testent souvent **la portee (instance unique vs partage)**, **le comportement AZ** et **les compromis cout/performance**

---
*Traduit par Claude*
