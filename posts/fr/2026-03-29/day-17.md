---
title: "Jour 17"
date: "2026-03-29"
excerpt: "J’ai étudié la DR CloudOps, la sécurité et la conformité, l’identité IAM et Route 53 en trois volets (bases DNS, politiques de routage et health checks, puis délégation resolver logging firewall arc profiles) et rédigé six notes de collection."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "disaster-recovery", "cloudops", "certification", "security", "kms", "waf", "compliance", "iam", "sts", "federation", "route-53", "dns"]
---

## Aujourd'hui, j'ai :

- poursuivi la prépa certification aws sur la reprise après sinistre et rédigé [AWS DataSync and AWS Backup: Disaster Recovery Notes](/fr/posts/aws-datasync-and-backup-disaster-recovery-notes) pour la collection cloudops
- poursuivi le volet sécurité et conformité (périmètre, contrôles de détection, logs, gouvernance, chiffrement, tls, secrets) et rédigé [AWS Security, Compliance, Encryption, and Secrets for CloudOps](/fr/posts/aws-security-compliance-encryption-and-secrets-notes) pour la même collection
- étudié l’identité aws (permission boundaries vs scp, rapport d’identifiants, access advisor, iam access analyzer, sts et assume role cross-account, saml et broker custom et cognito federation, simulateur de politiques iam) et rédigé [AWS IAM Identity: Permission Boundaries, Federation, STS, and Access Tools](/fr/posts/aws-iam-identity-permission-boundaries-federation-sts-notes) pour la collection cloudops
- terminé la journée avec route 53 (résolution dns et terminologie, hosted zones, a/aaaa/cname/ns, ttl et cache, mx et txt pour l’email, alias vs cname et apex de zone) et rédigé [Amazon Route 53: DNS Fundamentals, Records, TTL, and Alias vs CNAME](/fr/posts/aws-route-53-dns-fundamentals-records-ttl-and-aliases) pour la collection cloudops
- poursuivi route 53 avec les politiques de routage (simple, pondérée, latence, basculement, géolocalisation, géoproximité, multi-valeur, basée sur l’ip), health checks et traffic flow, et rédigé [Amazon Route 53: Routing Policies, Health Checks, and Traffic Flow](/fr/posts/aws-route-53-routing-policies-health-checks-and-traffic-flow) pour la collection cloudops
- bouclé route 53 avec multi-valeur vs simple, registrar vs délégation dns, alias site s3, resolver hybride, logs de requêtes, pare-feu dns, arc et profiles, et rédigé [Amazon Route 53: Registrar Delegation, Resolver, Logging, and Governance](/fr/posts/aws-route-53-delegation-resolver-logging-firewall-arc-profiles) pour la collection cloudops

---
*Traduit par Claude*
