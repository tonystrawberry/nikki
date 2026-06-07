---
title: "Identité AWS IAM : limites de permission, fédération, STS et outils d’accès"
date: "2026-03-29"
excerpt: "Notes CloudOps sur les permission boundaries IAM vs politiques d’identité et SCP, rapport d’identifiants et Access Advisor, IAM Access Analyzer, STS (AssumeRole, SAML, web identity, MFA), fédération entreprise vs appli (SAML, broker custom, Cognito), simulateur de politiques IAM."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "iam", "sts", "saml", "cognito", "permission-boundary", "access-analyzer", "federation", "cloudops", "certification", "security"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 14
collectionTitle: "AWS CloudOps Engineer - Associate"
---

Sujets **identité et accès** fréquents aux examens **SysOps / CloudOps** : comment les **permissions effectives** combinent **SCP**, **permission boundaries** et **politiques basées sur l’identité** ; outils IAM **opérationnels** pour l’**hygiène des identifiants** et le **moindre privilège** ; détection des accès **externes** avec **IAM Access Analyzer** ; identifiants **temporaires** via **AWS STS** ; schémas de **fédération** pour les **entreprises** et les **applications** publiques ; et **simulation de politiques** avant la prod.

Articles liés de la collection : **[AWS Security, Compliance, Encryption, and Secrets for CloudOps](/fr/posts/aws-security-compliance-encryption-and-secrets-notes)** (KMS, Secrets Manager, Security Hub, etc.).

## Permission boundaries IAM

- **Uniquement pour les utilisateurs et rôles IAM** — **pas** pour les **groupes IAM**.
- Une **permission boundary** est une **politique managée** qui fixe le **maximum** de permissions qu’une entité peut **recevoir**. Elle **n’accorde** pas l’accès seule.
- Les **permissions effectives** du principal sont l’**intersection** de :
  - ce que les politiques **basées sur l’identité** **autorisent**, et
  - ce que la **permission boundary** **autorise** (moins les **deny** explicites dans l’un ou l’autre, plus les politiques **ressource** et **SCP** le cas échéant).

**Modèle mental du cours :** si la limite n’autorise que **`s3:*`**, **`cloudwatch:*`**, **`ec2:*`**, et que la politique d’identité autorise **`iam:CreateUser`**, l’**union** « ce que la limite permet » et « ce que la politique demande » ne donne **toujours pas** d’accès **`IAM`** — **`CreateUser`** est hors limite, donc **non effectif**.

### Rapport avec les SCP Organizations

Trois couches qui **restreignent** ce qui est possible :

1. **Service control policies (SCP)** — **garde-fous** org / OU / compte (ne **donnent** pas de droits aux principals seules).
2. **Permission boundary** — plafond pour **cet utilisateur ou rôle**.
3. **Politique basée sur l’identité** — ce que vous **voulez** que le principal fasse.

L’accès **effectif** est là où **toutes** les contraintes applicables **se recoupent**. Les **permission boundaries** **ressemblent** aux **SCP** dans l’esprit : une **limite** extérieure ; les **politiques d’identité** définissent les **allow** réels **dans** cette limite.

### Cas d’usage typiques

- **Déléguer** l’admin IAM à des **non-admins** (créer des utilisateurs ou attacher des politiques) **sans** leur permettre de devenir **admin** — la limite **bloque** les services ou actions interdits.
- Laisser les **développeurs** **s’attribuer** certaines politiques tout en **empêchant l’élévation de privilèges** au-delà de la limite.
- Resser **un** utilisateur ou **un** rôle sans modifier les **SCP** à l’échelle du compte.
- **Prototyper** l’effet d’un plafond **type SCP** avec une **boundary** sur un principal de test avant un déploiement org.

## Rapport d’identifiants IAM (périmètre compte)

- Rapport **au niveau compte** : **IAM → Credential report** → **Télécharger** (CSV).
- Liste **tous les utilisateurs IAM** du compte (et le **root** le cas échéant) avec métadonnées d’**identifiants** :
  - date de création utilisateur
  - **mot de passe** activé / dernière utilisation / dernier changement ; attentes de **rotation** si configurée
  - statut **MFA**
  - **clés d’accès** : présentes ou non, **rotation** et **dernière utilisation**
  - **certificats de signature** et champs associés (CSV du cours)
- Utilisation : **revues sécurité** ; mots de passe périmés, **MFA** manquant, anciennes **clés d’accès**, comptes à traiter.

## IAM Access Advisor (périmètre utilisateur / rôle / groupe)

- Vue **par principal** dans la console : ouvrir un **utilisateur** (ou entrée équivalente pour **rôles** / **groupes**) → **Access Advisor** / informations **Last accessed**.
- Indique **quels services AWS** le principal **pourrait** utiliser (droits accordés) et **quand** chaque service a été **dernièrement utilisé** (activité API ou console dans la fenêtre de rapport).
- Aide au **moindre privilège** : repérer les permissions de **service inutilisées** et **réduire** les politiques.
- **Zoom :** pour un service (ex. **EC2**), l’UI peut indiquer **quelle politique** (ex. **`AdministratorAccess`**) a donné l’accès — utile avec beaucoup de politiques attachées.

## IAM Access Analyzer

- **Objectif :** repérer les ressources **partagées** avec des principals **hors** de votre **zone de confiance** définie (exposition **externe** ou **cross-account** non voulue).
- **Types de ressources** cités en formation : compartiments **S3**, **rôles IAM**, clés **KMS**, **fonctions et couches Lambda**, files **SQS**, secrets **Secrets Manager** (vérifier la couverture actuelle dans la doc AWS).
- Vous définissez une **zone de confiance** — ex. **ce compte AWS** ou **toute votre Organization** — et l’analyseur remonte des **findings** lorsque l’accès dépasse cette zone (autre **compte**, principals **anonymes** / **publics**, identités **externes** par IP ou motif selon la politique ressource).
- **Activer** un analyseur crée un **rôle lié au service** pour lire politiques et ressources. L’activation est **gratuite** dans le récit du cours ; vérifier la **facturation** pour l’usage continu.
- **Cycle de vie des findings :**
  - **Active** — la politique correspond encore.
  - **Resolved** — vous avez **corrigé** la politique (ex. retiré `Principal: *` sur une file **SQS**) ; **rescan** pour confirmer.
  - **Archived** — vous acceptez le risque (ex. **S3** volontairement public) ; le finding passe en **archivé**.
- **Règles d’archivage :** archiver **automatiquement** les findings correspondant à des critères (ex. modèles de compartiments publics **approuvés**).

## AWS Security Token Service (STS)

- **STS** délivre des identifiants **à courte durée** (**access key ID**, **secret**, **session token**) pour l’accès limité dans le temps aux API AWS.
- **Durée :** configurable (le cours cite **environ une heure** ou **plus** selon le contexte et l’API — vérifier la **durée de session max** par flux et rôle).
- **API** courantes :
  - **`AssumeRole`** — identifiants pour un **rôle IAM** dans le **même** ou un **autre** compte ; accès **cross-account**, élévation de **session**, flux **fédérés** qui s’appuient sur **AssumeRole**.
  - **`AssumeRoleWithSAML`** — échanger une **assertion SAML** d’un **IdP** entreprise contre des identifiants **temporaires** (après **confiance** et fournisseur **SAML**).
  - **`AssumeRoleWithWebIdentity`** — échanger des jetons **OIDC** / web identity (ex. login social) ; **AWS oriente** les nouvelles applis vers **Amazon Cognito** plutôt que d’appeler cette API directement depuis les applis dans beaucoup de cas.
  - **`GetSessionToken`** — identifiants temporaires **avec MFA** pour un **utilisateur IAM** ou **root** après vérification **MFA** (cadrage du cours).
- **Schéma cross-account (classique à l’examen) :**
  1. Dans le **compte B** (ex. **prod**), créer un **rôle IAM** avec droits sur la ressource (ex. compartiment **S3**) et une **politique de confiance** autorisant le **compte A** (ex. **dev**) à **`sts:AssumeRole`**.
  2. Dans le **compte A**, accorder aux principals **`sts:AssumeRole`** sur l’**ARN** de ce rôle.
  3. L’utilisateur en **A** appelle **`AssumeRole`** → reçoit des identifiants **temporaires** → les utilise comme le rôle du **compte B** pour les appels **API**.

Sans **les deux** côtés — **confiance** en **B** et **permission d’assume** en **A** — **`AssumeRole`** échoue.

## Fédération d’identité (vue d’ensemble)

La **fédération** signifie que les utilisateurs **n’ont pas** besoin d’**utilisateurs IAM** longue durée dans AWS : ils s’authentifient **ailleurs**, puis reçoivent des identifiants AWS **temporaires** (souvent via **STS** et des **rôles**).

### SAML 2.0 (entreprise)

- Typique des **grandes entreprises** avec **ADFS**, **Azure AD** ou autres **IdP SAML 2.0**.
- L’utilisateur s’authentifie auprès de l’**IdP** → reçoit une **assertion SAML** → l’échange via **`AssumeRoleWithSAML`** (CLI/SDK) ou le point d’entrée **console** de fédération (connexion navigateur à la **console de gestion AWS**).
- **Avantage :** **pas** d’utilisateur IAM par salarié ; accès **basé sur les rôles** et **temporaire**.

### Broker d’identité custom (entreprise, non SAML)

- Sans chemin **SAML 2.0**, vous construisez une **application broker** qui :
  - authentifie les utilisateurs contre votre **annuaire** d’entreprise, et
  - appelle **STS** (avec des identifiants **privilégiés** du broker) pour émettre des identifiants **temporaires** avec une **politique** adaptée à chaque utilisateur.
- **Plus de travail** que l’intégration **SAML** native, mais même **idée** : identité **externe** → **broker** → **STS** → accès AWS **temporaire**.

### Amazon Cognito (applications web et mobiles)

- Pour utilisateurs **web** ou **mobile** (ex. upload **S3** avec **Facebook** / **Google** / **Cognito User Pools** / **SAML** / **OIDC**) :
  - L’appli authentifie l’utilisateur auprès de l’**IdP** → obtient un **jeton** → appelle les **identity pools** Cognito → Cognito valide le jeton et appelle **STS** → l’appli reçoit des identifiants **temporaires** étendus par des **rôles IAM** mappés dans le **identity pool**.
- La **documentation AWS** déconseille de s’appuyer sur la **Web Identity Federation** « brute » sans **Cognito** pour les nouvelles applis — **Cognito** est la réponse **orientée examen** pour la fédération d’**applications** **publiques**.

## Simulateur de politiques IAM

- **Objectif :** **tester** et **dépanner** si un **principal** serait **autorisé** ou **refusé** pour une **action** sur une **ressource** **avant** ou **sans** modifier partout en prod.
- Accessible depuis la **console IAM** (lien dans la **documentation** « IAM Policy Simulator » si l’URL console change).
- Peut intégrer :
  - politiques **basées sur l’identité** sur **utilisateurs**, **groupes**, **rôles**
  - politiques **basées sur les ressources** (ex. politique de compartiment **S3**)
  - **permission boundaries**
  - **SCP Organizations** lorsque le compte est dans une **Organization** (le simulateur reflète l’effet **SCP** dans la démo du cours)
- Vous choisissez **service** et **action** (ex. **`sqs:DeleteMessage`**, **`sqs:DeleteQueue`**), lancez la **simulation**, et inspectez **allow** / **implicit deny** avec la **clause** correspondante (ou aucune).
- Outil solide pour comprendre « pourquoi c’est **refusé** ? » quand plusieurs politiques interagissent.

## Points clés à retenir

- Les **permission boundaries** s’appliquent **aux utilisateurs et rôles uniquement** ; elles **plafonnent** les permissions effectives ; se combinent avec les politiques d’**identité** et les **SCP** comme **contraintes qui se croisent**.
- **Credentials Report** = inventaire **CSV** des **identifiants** à l’échelle du **compte** ; **Access Advisor** = **dernier accès** par **service** par **principal** pour le **moindre privilège**.
- **Access Analyzer** = **zone de confiance** vs findings d’accès **externe** ; **résoudre** en corrigeant les politiques ou **archiver** le risque accepté ; **règles d’archivage** pour l’automatisation.
- **STS** = identifiants **temporaires** ; **`AssumeRole`** pour **rôles** et **cross-account** ; **`AssumeRoleWithSAML`** pour **SAML** entreprise ; **`GetSessionToken`** pour sessions **MFA** ; les flux **web identity** vont de plus en plus vers **Cognito**.
- **Fédération** = **IdP externe** → **jeton/assertion** → **STS** (directement ou via **Cognito**) → accès AWS **temporaire** ; **broker custom** quand **pas SAML**.
- **Simulateur de politiques** = **what-if** sûr sur les couches **identité**, **ressource**, **boundary** et **SCP**.

---
*Traduit par Claude*
