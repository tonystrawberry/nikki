---
title: "Jour 21"
date: "2026-04-13"
excerpt: "Étude des chapitres 7/8 de DDIA, pratique de tests de concurrence, notes d'architecture AWS et état d'esprit d'adoption de l'IA pour les développeurs."
author: "Tony Duong"
category: "daily"
tags: ["engineering", "ddia", "reading", "transactions", "youtube", "video", "concurrency", "testing", "distributed-systems", "aws", "iam-identity-center", "sandbox", "ai"]
---

## Aujourd'hui, j'ai :

- terminé la lecture du chapitre 7 de DDIA sur les transactions et rédigé [DDIA Chapter 7: Transactions](/fr/posts/ddia-chapter-7-transactions) pour la collection DDIA
- regardé [Transactions, ACID, and Isolation Levels — DDIA Chapter 7](/fr/posts/ddia-chapter-7-transactions-acid-and-isolation-video) — présentation en direct d'ACID, des noms de niveaux d'isolation vs leur sémantique, de MVCC dans Postgres et de vacuum/autovacuum, ainsi que des undo logs d'InnoDB pour les snapshots
- appris à écrire un test concurrent générique simple où deux workers mettent a jour des enregistrements differents en parallele et où les deux mises a jour persistent sans lost update
- commencé la lecture du chapitre 8 de DDIA sur les difficultes des systemes distribues et redige [DDIA Chapter 8: The Trouble with Distributed Systems](/fr/posts/ddia-chapter-8-the-trouble-with-distributed-systems), je le terminerai demain
- lu AWS [Innovation Sandbox on AWS](https://docs.aws.amazon.com/solutions/innovation-sandbox-on-aws/) et noté l'architecture de référence pour l'accès aux comptes, l'hébergement de la web ui, les workflows event-driven et la gouvernance des comptes sandbox
- lu l'article du AWS Builder Center [AI won’t replace developers, but ignoring it will cost you](https://builder.aws.com/content/3C849AI6lTrLJQG0bBFo1UdO20o/ai-wont-replace-developers-but-ignoring-it-will-cost-you)

## Extrait générique Ruby/Rails RSpec

```ruby
# spec/models/job_concurrency_spec.rb
it "keeps both updates without lost update" do
  job = Job.create!(state: { "a" => { "status" => "pending" }, "b" => { "status" => "pending" } })
  ready = Queue.new
  go = Queue.new

  threads = %w[a b].map do |key|
    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        local = Job.find(job.id)
        ready << true
        go.pop
        local.update_node_status!(key, "succeeded")
      end
    end
  end

  2.times { ready.pop }
  2.times { go << true }
  threads.each(&:join) # wait for both threads to finish

  result = Job.find(job.id)
  expect(result.state.dig("a", "status")).to eq("succeeded")
  expect(result.state.dig("b", "status")).to eq("succeeded")
end
```

```ruby
# app/models/job.rb
def update_node_status!(key, status)
  with_lock do
    data = state.deep_dup
    data[key]["status"] = status
    update!(state: data)
  end
end
```

## AWS Innovation Sandbox on AWS (résumé rapide)

- utilise **IAM Identity Center** pour permettre aux admins/managers/utilisateurs sandbox d'acceder aux comptes sandbox avec une authentification/autorisation centralisee
- sert la web ui via **CloudFront + S3**, avec le trafic API protege par **WAF** et route via **API Gateway**
- execute la logique de workflow avec **Lambda**, **EventBridge** et **Step Functions** pour le cycle de vie des comptes et l'automatisation
- stocke l'etat/la configuration dans **DynamoDB** et **AppConfig**, avec une separation claire entre control plane et comptes sandbox geres

![Architecture AWS Innovation Sandbox](/images/blog/2026-04-13/aws-innovation-sandbox-architecture.png)

---
*Traduit par Claude*
