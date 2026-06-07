---
title: "DDIA Chapitre 7 : Transactions"
date: "2026-04-13"
excerpt: "Résumé du chapitre de Kleppmann sur les transactions : ACID, anomalies d'isolation, snapshot isolation, two-phase locking et serializable snapshot isolation."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "transactions", "acid", "isolation", "distributed-systems", "mvcc"]
collection: "ddia"
collectionOrder: 7
collectionTitle: "Designing Data-Intensive Applications"
---

## Vue d'ensemble

Le chapitre 7 de *Designing Data-Intensive Applications* traite des **transactions** : regrouper lectures et ecritures en une unite logique afin que la base fournisse des **garanties de surete** (souvent resumees par **ACID**) malgre les crashes et l'acces concurrent. Une grande partie du chapitre porte sur l'**isolation** : quelles anomalies peuvent apparaitre quand des transactions s'executent en parallele, et quels **niveaux d'isolation** echangent performance contre un resultat ressemblant plus ou moins a une execution serie.

## Pourquoi les transactions comptent

- **Tout ou rien :** soit toute la transaction est commit, soit elle n'a aucun effet (**atomicite**), ce qui simplifie la gestion d'erreurs quand une ecriture touche plusieurs lignes ou index.
- **Recuperation apres crash :** la base utilise des **logs** (par ex. WAL) pour que le travail commit survive aux redemarrages ; les transactions abort sont rollback.
- **Acces concurrent :** sans regles claires, les lectures/ecritures entrelacees produisent des **race conditions** difficiles a raisonner dans le code applicatif.

**ACID** est une etiquette utile mais non standardisee : la "consistency" melange souvent contraintes de base et invariants metier.

## Anomalies et niveaux d'isolation

L'isolation faible existe parce qu'une **execution vraiment serie** (une transaction a la fois) est souvent trop lente. Les niveaux plus faibles autorisent des ordonnancements qui ne sont equivalents a *aucun* ordre serie des memes transactions. Problemes courants :

| Phenomenon | Idea |
|------------|------|
| **Dirty read** | Lire des donnees ecrites par une autre transaction mais non commit. |
| **Dirty write** | Ecraser des donnees non commit d'une autre transaction. |
| **Read skew (non-repeatable read)** | Dans une transaction, la meme requete executee deux fois voit des snapshots commit differents car une autre transaction a commit entre-temps. |
| **Lost update** | Deux transactions font read-modify-write sur le meme etat ; une mise a jour ecrase l'autre. |
| **Write skew** | Deux transactions lisent des lignes qui se recouvrent et prennent des decisions localement coherentes, mais ensemble elles violent un invariant (exemple classique : deux medecins d'astreinte qui se mettent tous deux hors service). |
| **Phantom read** | Une transaction relance une requete de plage et voit de nouvelles lignes correspondantes (inserees par une autre transaction). |

La **snapshot isolation** donne a chaque transaction un **snapshot coherent** de la base au debut de la transaction (ou a la premiere lecture), evitant de nombreux read-skew pour les lectures, mais **n'empeche pas automatiquement le write skew** — il peut falloir des **contraintes explicites** ou un comportement **serializable**.

## Read Committed

Niveau par defaut courant : on ne lit que des donnees **commit**, et des **verrous d'ecriture courts** evitent les dirty writes. Il ne garantit **pas** un snapshot stable sur toute la transaction — les non-repeatable reads restent possibles.

## Snapshot Isolation et Multi-Version Concurrency Control (MVCC)

La snapshot isolation est souvent implementee via **MVCC** : la base conserve plusieurs versions de lignes ; une transaction voit les versions visibles a son timestamp de snapshot. Les writers creent de nouvelles versions ; readers et writers ne se bloquent en general pas mutuellement, selon des regles de type **first-writer-wins** ou **abort on conflict**.

## Isolation Serializable

Une execution serializable signifie que le resultat est **comme si** les transactions s'etaient executees l'une apres l'autre dans un certain ordre — pas de lost updates, write skew ni phantoms (dans les garanties annoncees par le systeme).

Strategies d'implementation discutees dans le chapitre :

- **Execution serie reelle :** executer les transactions sur un seul thread (ou une partition) quand la charge le permet ; peut etre tres rapide pour des systemes in-memory avec transactions courtes.
- **Two-phase locking (2PL) :** verrouillage fort classique ; des **predicate / index-range locks** traitent les phantoms en verrouillant les chemins d'acces, pas seulement les lignes existantes.
- **Serializable snapshot isolation (SSI) :** approche optimiste au-dessus de la snapshot isolation — suivre les **dependances** entre transactions concurrentes et **abort** en cas de motif dangereux (ex. cycles dans le graphe de serialisation). L'objectif est d'obtenir des performances proches du snapshot avec une semantique serializable.

## Exemple generique Rails/RSpec : tester un lost update

Voici un modele simplifie pour tester des ecritures concurrentes dans une application Rails. Deux workers mettent a jour des cles differentes dans le meme etat JSON, et le test verifie que les deux mises a jour persistent.

```ruby
# spec/models/job_concurrency_spec.rb
require "rails_helper"

RSpec.describe "concurrent updates", type: :model do
  it "keeps both updates without lost update" do
    job = Job.create!(
      state: {
        "node_a" => { "status" => "pending" },
        "node_b" => { "status" => "pending" }
      }
    )

    ready = Queue.new
    go = Queue.new

    threads = %w[node_a node_b].map do |node_key|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          local = Job.find(job.id)
          ready << true
          go.pop
          local.update_node_status!(node_key, "succeeded")
        end
      end
    end

    2.times { ready.pop } # both workers prepared
    2.times { go << true } # release at nearly same time
    threads.each(&:join)

    reloaded = Job.find(job.id)
    expect(reloaded.state.dig("node_a", "status")).to eq("succeeded")
    expect(reloaded.state.dig("node_b", "status")).to eq("succeeded")
  end
end
```

```ruby
# app/models/job.rb
class Job < ApplicationRecord
  # Example column: state :jsonb
  def update_node_status!(node_key, new_status)
    with_lock do
      data = state.deep_dup
      data[node_key] ||= {}
      data[node_key]["status"] = new_status
      update!(state: data)
    end
  end
end
```

`with_lock` rend le read-modify-write atomique au niveau de la ligne, afin qu'un worker n'ecrase pas accidentellement la modification de l'autre.

## Points cles

- Les **transactions** regroupent les operations pour l'atomicite et des semantiques d'echec plus claires ; l'**isolation** definit quelles interleavings concurrentes sont autorisees.
- Une isolation plus faible ameliore le debit mais introduit des **anomalies** specifiques ; comprendre **read skew**, **lost updates**, **write skew** et **phantoms** est essentiel pour choisir un niveau.
- **Snapshot isolation + MVCC** est tres utilisee pour les charges a forte lecture ; ce n'est **pas** equivalent a une serializabilite complete pour tous les motifs d'ecriture.
- Un comportement **serializable** peut etre obtenu par **execution serie**, **2PL** (avec predicate locking pour les phantoms) ou **SSI** — chaque approche ayant des compromis operationnels differents.

---
*Traduit par Claude*
