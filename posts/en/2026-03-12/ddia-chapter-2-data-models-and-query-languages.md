---
title: "DDIA Chapter 2: Data Models and Query Languages"
date: "2026-03-12"
excerpt: "Notes on Chapter 2 of Designing Data-Intensive Applications — relational vs document models, query languages, and graph databases."
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["ddia", "databases", "data-modeling", "sql", "nosql", "graph-databases"]
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1034&auto=format&fit=crop&ixlib=rb-4.1.0"
collection: "ddia"
collectionOrder: 2
collectionTitle: "Designing Data-Intensive Applications"
---

## Overview

Chapter 2 explores how we model data and how we query it. The choice of data model has a profound effect on how we think about the problem we're solving. Each model comes with assumptions about how data will be used, and those assumptions make some operations easy and others awkward.

## Relational Model vs Document Model

The **relational model** (SQL) organizes data into tables of rows. It was proposed by Edgar Codd in 1970, became dominant by the mid-1980s, and remains the standard for most applications.

The **document model** (NoSQL) emerged in the 2010s, driven by:

- Need for greater scalability (large datasets, high write throughput)
- Preference for free and open-source software
- Specialized query operations not well supported by relational model
- Frustration with restrictive relational schemas — desire for a more dynamic, expressive data model

### The Object-Relational Mismatch

Most application code uses objects or structs, but relational tables require an awkward translation layer (sometimes called **impedance mismatch**). ORMs help but don't fully hide the differences.

A résumé is a good example: in a relational database you'd need multiple tables (education, work experience, contact info) joined to a user. In a document model, the whole thing can be one JSON document — much closer to how the application sees it.

### Relational vs Document Databases Today

| Aspect | Relational | Document |
|--------|-----------|----------|
| Schema | Schema-on-write (enforced) | Schema-on-read (flexible) |
| Joins | Natural, well-supported | Weak, often requires application-level joins |
| Many-to-one | Easy with foreign keys | Requires denormalization or app-level joins |
| Data locality | Spread across tables | Whole document stored together |
| Best for | Highly interconnected data | Self-contained documents, one-to-many trees |

**Convergence**: relational databases now support JSON/XML columns; document databases are adding join-like features. The models are becoming more similar over time.

## Many-to-One and Many-to-Many Relationships

When you store a plain text value like "Greater Seattle Area" instead of an ID, you're duplicating information. Using an **ID** that references a canonical record (normalization) provides:

- Consistent spelling/formatting
- Easy updates (change in one place)
- Localization support
- Better search

This requires **joins**. Document databases historically haven't supported joins well, pushing joins into application code — which is slower and more complex.

As applications grow, data tends to become more interconnected, and the lack of join support becomes increasingly painful.

## Query Languages for Data

### Declarative vs Imperative

- **Imperative** (most programming languages): you tell the machine what steps to perform
- **Declarative** (SQL, CSS): you describe the pattern of the result you want, and the database optimizer figures out how to get it

Declarative languages are better for databases because:
- The optimizer can improve without changing queries
- They're easier to parallelize
- They hide implementation details

### MapReduce

A programming model for processing large amounts of data across many machines. It's neither fully declarative nor fully imperative — you write `map` and `reduce` functions (which must be pure), and the framework handles distribution.

MongoDB supports a MapReduce-like query API, but also introduced the **aggregation pipeline** as a more declarative alternative.

## Graph-Like Data Models

When many-to-many relationships dominate your data, it's natural to model it as a **graph**: vertices (nodes) connected by edges (relationships).

Examples: social networks, web links, road networks, fraud detection.

### Property Graphs (Neo4j, etc.)

- Each **vertex** has a unique ID, a set of outgoing/incoming edges, and a collection of properties (key-value pairs)
- Each **edge** has a unique ID, tail vertex, head vertex, a label describing the relationship, and properties
- Any vertex can connect to any other vertex — no schema restricts which kinds of things can be connected

Query language: **Cypher** — a declarative language for property graphs.

```
MATCH (person)-[:BORN_IN]->(place)-[:WITHIN*0..]->(usa:Location {name: 'United States'})
RETURN person.name
```

### Triple-Stores (RDF)

All information stored as **(subject, predicate, object)** triples. The subject is a vertex, and the object is either a primitive value (property) or another vertex (edge).

Query language: **SPARQL** — similar to Cypher but for triple-stores.

### Datalog

The oldest of the three, foundational to later query languages. Uses a set of rules that can be combined and reused, making it powerful for complex queries.

## Key Takeaways

1. **No single data model is best for everything** — pick based on your access patterns
2. **Document databases** shine when data is self-contained and relationships are mostly one-to-many
3. **Relational databases** remain the best default for most applications with interconnected data
4. **Graph databases** are ideal when anything can relate to anything
5. **Declarative query languages** outperform imperative ones in databases because they enable optimization
6. Data models are converging — relational databases add document features, document databases add relational features
