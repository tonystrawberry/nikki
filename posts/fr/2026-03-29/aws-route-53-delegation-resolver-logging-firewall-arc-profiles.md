---
title: "Amazon Route 53 : délégation registrar, Resolver, journalisation et gouvernance"
date: "2026-03-29"
excerpt: "Notes CloudOps sur séparer registrar et DNS, déléguer les NS vers Route 53, alias site web S3, DNS hybride avec endpoints Resolver, zones hébergées privées cross-account, journalisation des requêtes, pare-feu DNS Resolver, ARC, profils Route 53 et nettoyage des coûts."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "route-53", "dns", "resolver", "s3", "hybrid-dns", "dns-firewall", "arc", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 17
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Cette note traite **qui sert le DNS** vs **où vous avez acheté le domaine**, les **sites web statiques S3** derrière des noms **personnalisés**, le DNS **hybride** avec **Route 53 Resolver**, les zones hébergées **privées cross-account**, la **journalisation**, le **pare-feu DNS**, **Application Recovery Controller**, les **profils Route 53**, et le **tarif** / **nettoyage** après les labs.

**Parties précédentes :** **[Fondamentaux DNS](/fr/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases)** ・ **[Politiques de routage et health checks](/fr/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow)**.

## Bureau d’enregistrement vs service DNS

- **Registrar** = où vous **payez** le **domaine** (renouvellement annuel). Exemples : enregistrement **Route 53**, **GoDaddy**, **Google Domains**, autres.
- **Hébergement DNS** = où vivent la **zone** et les **enregistrements** (**serveurs de noms** **faisant autorité**).

**Vous pouvez mixer les fournisseurs :** enregistrer chez **GoDaddy** mais héberger le DNS dans **Route 53**, ou enregistrer dans **Route 53** mais utiliser un autre **fournisseur DNS** (moins courant en formation).

**Délégation :** créer une **hosted zone publique** dans **Route 53** et copier les **quatre** enregistrements **NS** assignés par Route 53. Chez le **registrar**, définir des **serveurs de noms personnalisés** sur ces **valeurs**. Après **propagation**, **toutes** les modifications d’**enregistrements** se font dans **Route 53** ; le registrar ne garde que l’**enregistrement** du domaine et la **délégation NS**.

## Site web statique S3 et Route 53

- Activer **l’hébergement de site web statique** sur le compartiment et définir le document **index** (ex. **`index.html`**). Les objets doivent être **lisibles** comme requis (public ou via **politiques** — suivre les **bonnes pratiques S3** actuelles).
- **Critique à l’examen :** le **nom du compartiment** doit **exactement correspondre** au **FQDN** souhaité (ex. compartiment **`blog.example.com`** pour l’enregistrement **`blog.example.com`**).
- Dans **Route 53**, créer un enregistrement **alias** **A** ciblant l’**endpoint de site web S3** pour cette **Région** (la console guide vers les **endpoints de sites web S3**, pas l’endpoint **API REST**).
- **HTTP uniquement** sur les endpoints **site web S3** pour ce schéma ; **HTTPS** avec un **domaine personnalisé** passe en général par **CloudFront** devant (certificat sur **ACM**, **domaine alternatif** sur la distribution).

## Route 53 Resolver (DNS hybride)

- Chaque **VPC** reçoit une adresse **Resolver** (**.2**) qui répond aux requêtes pour le DNS **fourni par Amazon**, les **hosted zones privées** rattachées au **VPC**, et les noms **publics** Internet via résolution **récursive** **par défaut**.

Les déploiements **hybrides** nécessitent une **connectivité** (**VPN site à site**, **Direct Connect**, ou équivalent) entre **on-premises** et **AWS**.

| Endpoint | Direction | Rôle (haut niveau) |
|----------|-----------|-------------------|
| **Inbound** | **Résolveurs on-premises → AWS** | Transmettre les requêtes pour les noms **Route 53** **privés** (ex. **hosted zones privées**) vers **AWS** pour que les clients **on-prem** résolvent les enregistrements **cloud**. |
| **Outbound** | **AWS → DNS on-premises** | Transmettre les requêtes des charges **VPC** vers le DNS de votre **datacenter** pour les zones **internes** (ex. **`app.corp.internal`**). |

Placer les endpoints Resolver **inbound**/**outbound** dans des **sous-réseaux** avec **routage** vers **on-prem** ; les **security groups** contrôlent **qui** peut les utiliser. Les **règles de forwarding** définissent **quels** suffixes vont **où**.

## Journalisation des requêtes DNS vs journalisation Resolver

### Hosted zones publiques — journalisation des requêtes DNS

- Journalise les **requêtes DNS** **publiques** reçues pour les **hosted zones publiques** (comme décrit en formation).
- Destination typique : **CloudWatch Logs** (puis **export** vers **S3** si besoin).
- Champs cités en exemple : **version du format de log**, **horodatage**, **ID de hosted zone**, **nom de requête**, **type de requête**, **code de réponse**, **protocole**, **edge location**, **IP du resolver**, **sous-réseau client EDNS** — confirmer le **schéma** actuel dans la doc.

### Journalisation des requêtes Resolver

- Journalise les **requêtes DNS** **depuis des ressources dans vos VPC** — couvre **hosted zones privées**, chemins Resolver **inbound/outbound**, **Resolver DNS Firewall**, etc.
- Destinations : **CloudWatch Logs**, **S3**, ou **Kinesis Data Firehose** (liste du cours).
- **Partage :** la configuration peut être partagée vers **d’autres comptes** via **AWS Resource Access Manager (RAM)** le cas échéant.

## Resolver DNS Firewall

- **Filtrage managé** des requêtes DNS **sortantes** quittant le **VPC** via **Route 53 Resolver** (politique DNS **sortante**).
- **Bloquer** des domaines **connus comme malveillants** ou **n’autoriser** que des domaines **approuvés** — atténue **l’exfiltration via DNS** et le **C2** **malware** par DNS.
- **AWS Firewall Manager** peut aider à **organiser** les **politiques** multi-comptes (comme au cours).
- Les **logs** s’intègrent à **CloudWatch Logs** et à la **journalisation des requêtes Resolver** (selon la formation).

## Application Recovery Controller (ARC)

- **Orchestre** et **automatise** la **reprise** pour les applications **critiques** sur les **AZ** et **Régions** (actif/actif ou actif/standby).
- Les **readiness checks** valident en continu que l’infrastructure **standby** / **réplica** peut prendre le trafic.
- Les **routing controls** s’appuient sur **Route 53** et les primitives de **santé** pour **déplacer** le trafic (**zonal shift**, **basculement régional**) en cas de **dégradation**.
- **Quand** vous avez des exigences **RTO/RPO** et **réglementaires** / **continuité d’activité** — **Route 53** reste la couche **DNS** qui **orchestre** les **mouvements** de **trafic utilisateur** dans le récit.

## Profils Route 53

- **Gestion centralisée** de la **configuration DNS** sur de **nombreux** **VPC** et **comptes**.
- Peut associer des **ressources** telles que **hosted zones privées**, **règles Resolver**, **groupes de règles** **Resolver DNS Firewall**, et **interfaces endpoint VPC** — puis **appliquer** le **profil** aux **VPC** sélectionnés pour qu’ils **héritent** de la **même** configuration **DNS**.
- **Cross-account :** **partager** les **profils** (et **ressources** liées) avec **RAM** pour qu’**autres** **comptes** consomment une **ligne de base** **standard**.
- La console peut aussi exposer **DNSSEC**, **failure mode**, et options de **lookup** **Resolver** au niveau **profil** (vérifier les **fonctionnalités** actuelles).

## Association cross-account de hosted zone privée

- Une **hosted zone privée** dans le **compte A** peut être **associée** à un **VPC** du **compte B** (schémas **services partagés** multi-compte ou DNS **hub**).
- **Ordre des opérations (examen) :**
  1. Dans le **compte A** (propriétaire de la zone), créer une **autorisation d’association VPC** pour le **VPC** du **compte B** (API/CLI — ex. `create-vpc-association-authorization` dans la famille d’API **Route 53**).
  2. Dans le **compte B**, **associer** le **VPC** à la **hosted zone privée** comme d’habitude ; Route 53 l’autorise car l’**autorisation** existe déjà dans le **compte A**.

Sans l’**autorisation**, l’association **cross-account** **échoue**.

## Coûts et nettoyage de lab

**Confirmez** tous les montants avec la **[tarification Route 53](https://aws.amazon.com/route53/pricing/)** — la formation utilise des **chiffres ronds**.

- **Domaine enregistré :** le renouvellement est **annuel** (cours **~12 $/an** pour un **`.com`** **bon marché** — **TLD** et **registrar** **variables**). **Supprimer** la **hosted zone** **ne résilie pas** l’**enregistrement** du domaine ; le **nom** reste **enregistré** jusqu’à **expiration** ou **transfert**.
- **Hosted zone :** une hosted zone **publique** ou **privée** a un **coût mensuel** tant qu’elle **existe** (cours **~0,50 $/mois** par zone — le **nombre** d’enregistrements ne change pas ce **socle** de base). Pour **supprimer** une **hosted zone**, **retirer** **tous** les **enregistrements** **d’abord** (sauf **NS**/**SOA** gérés par Route 53 — suivre les **étapes** **console** pour **vider** la zone), puis **supprimer** la **zone**.
- **Labs :** terminer les instances **EC2**, **ALB** et **groupes cibles** créés pour les démos de **routage** dans **chaque** **Région** utilisée ; supprimer les **health checks** et les **policy records Traffic Flow** si créés (Traffic Flow peut être **coûteux**).

## Points clés à retenir

- **Registrar ≠ DNS :** **déléguer** les **NS** chez le registrar vers les **serveurs de noms** **Route 53** pour utiliser les **hosted zones** dans **AWS**.
- **Site S3 + nom personnalisé :** **nom du compartiment = FQDN** ; **alias** vers l’endpoint **site web** ; **HTTP** seul sur **S3** — schéma **HTTPS** → **CloudFront**.
- Resolver **inbound** = **on-prem** → noms **AWS** ; **outbound** = **VPC** → DNS **on-prem** ; besoin de **chemin réseau** et de **règles**.
- **Deux familles de journalisation :** **requêtes DNS** des **zones publiques** vs **requêtes Resolver** **VPC** (destinations et **RAM** diffèrent).
- **DNS Firewall** = **filtrer** le DNS **sortant** des **VPC** ; cas **exfiltration** ; **Firewall Manager** pour l’**échelle**.
- **ARC** = **readiness** + **déplacements de trafic** pour reprise **multi-AZ** / **multi-Région** avec intégration **Route 53**.
- **Profils** = **standardiser** les rattachements **DNS** sur les **VPC** / **comptes** ; **RAM** pour le **partage**.
- **PHZ cross-account :** **autorisation** dans le **compte de la zone** **d’abord**, puis **association VPC** dans le **compte membre**.
- **Facturation :** **frais mensuels** de **hosted zone** tant que la **zone** **existe** ; **vider** les **enregistrements** puis **supprimer** la **zone** ; le **renouvellement** du **domaine** est **distinct** de la **suppression** de **zone**.

*Voir aussi : [Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow](/fr/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow).*

---
> 🌐 *Traduit par Claude*
