---
title: "Day 17"
date: "2026-03-29"
excerpt: "I studied AWS DataSync for scheduled large-file migration with metadata preservation and AWS Backup plans, vault lock, and the console walkthrough"
author: "Tony Duong"
category: "daily"
tags: ["engineering", "aws", "disaster-recovery", "datasync", "aws-backup", "snowcone", "s3", "efs", "fsx", "nfs", "smb", "ebs", "rds", "aurora", "dynamodb", "worm", "cloudops", "certification"]
---

## Today, I:

- continued aws certification prep in the disaster recovery section on aws datasync for moving large datasets to and from on-premises or other clouds into aws (or between aws storage services without an agent), using an on-prem or other-cloud agent over nfs, smb, hdfs, or similar, with scheduled replication (hourly, daily, weekly — not continuous, so expect lag)
- learned datasync targets include amazon s3 (including cold/glacier classes), efs, and fsx (all supported variants in the course), keeps file permissions and metadata compliant with nfs posix and smb — the course flags this as the exam-friendly option when questions require preserving metadata across moves
- noted a single datasync task can use up to about 10 gbps with optional bandwidth limits, supports bidirectional sync (aws back to on-prem), and snowcone ships with a preinstalled datasync agent when network capacity is too low for online transfer
- studied aws backup as a fully managed service for central automated backups across ec2, ebs, s3, rds (all supported engines), aurora, dynamodb, documentdb, neptune, efs, fsx (including lustre and windows file server), and storage gateway volume gateway, with cross-region copies, cross-account backups, pitr where supported, on-demand and scheduled jobs, and tag-based policies
- learned backup plans bundle frequency, backup window, optional transition to cold storage, and retention (days/weeks/months/years), assign resources by type or tags (e.g. `environment=production`), and store recovery points in service-managed storage backed by s3 internally
- reviewed backup vault lock as worm protection so locked backups cannot be deleted or have retention shortened — including by root — guarding against malicious or accidental deletes or policy changes
- followed the hands-on flow: create a plan from a template (e.g. daily plus monthly rules), edit backup rules (vault, schedule, cold transition, retention, optional copy to another region), assign resources with the default iam role, and use tag matching so a tagged ebs volume is picked up automatically; cleanup by removing assignments then the plan

