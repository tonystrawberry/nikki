---
title: "Jour 4"
date: "2026-03-14"
excerpt: "Lu le ch.4 de DDIA, créé des Claude SKILLS pour Shirimono et un CLI pour des résumés de fierté basés sur Slack (brag-slack-cli)"
author: "Tony Duong"
category: "daily"
tags: ["ddia", "databases", "claude", "skills", "japanese", "shirimono", "cli", "slack"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- lu [DDIA Chapitre 4 : Encodage et évolution](/fr/posts/2026-03-14/ddia-chapter-4-encoding-and-evolution) — formats d'encodage (JSON, Protobuf, Avro, Thrift), évolution des schémas et compatibilité ascendante/descendante dans les flux de données
- créé des Claude SKILLS pour générer des exercices de japonais de qualité pour Shirimono — bien mieux qu'utiliser l'API Gemini
- construit un CLI qui génère des résumés de réalisations à partir de tes messages Slack pour les bilans de performance ([brag-slack-cli](https://github.com/tonystrawberry/brag-slack-cli))

### Exemple de sortie (1er janv. – 14 mars 2026)

```markdown
Over the period of January 1, 2026, to March 14, 2026, I have served as a primary technical leader and operational anchor for the Backend team, driving high-priority product initiatives while simultaneously elevating our system stability and team culture. My work has spanned the full development lifecycle, from architecting complex AI-driven features like Panorama Enhancement and Contextual Chat to implementing rigorous observability standards via Datadog and BigQuery. By balancing hands-on coding with proactive mentorship, process optimization, and cross-functional coordination, I have ensured that our team maintains high velocity without compromising on technical health. I have consistently acted as a bridge between Product, Frontend, and Infrastructure teams, ensuring that architectural decisions are documented, risks are mitigated early, and new team members are effectively onboarded and unblocked.

### Key Contributions & Feature Development

*   **AI-Driven Image Processing and Annotation Features**
    *   I took ownership of the `[PROJ-177]` initiative, focusing on generative AI content removal and the addition of placement annotations, coordinating with the Frontend team to ensure seamless integration.
    *   I led the end-to-end development and infrastructure setup for the Panorama Enhancement feature, successfully transitioning the system from a Lambda-based CPU architecture to an ECS-based GPU architecture to meet critical response-time requirements.
    *   I managed the technical implementation and presentation preparation for the Content Removal/Placement and Small Object Removal features, including conducting deep-dive presentations to ensure collective team understanding.
    *   I took primary ownership of the `[PROJ-353]` AI Contextual Chat feature, implementing the CRUD API and defining technical requirements for file attachments and URL generation to ensure scalability.
    *   I provided critical guidance and oversight for the Theme Selector feature, reviewing API specifications and schemas to ensure alignment between frontend requirements and backend capabilities.
    *   I proactively identified gaps in documentation regarding the design of the management screen for annotation settings and sought clarification to keep the project on track.

*   **System Stability, Performance, and Bug Resolution**
    *   I successfully identified and resolved a critical deadlock issue in the main web application, verifying the fix in both staging and production environments.
    *   I systematically worked through a backlog of integration-related tasks, including resolving `NoMethodError`, `Aws::S3::Errors::NotFound`, and `Pundit::NotAuthorizedError` exceptions, significantly reducing production error rates.
    *   I revamped the Datadog SLO/SLI dashboards, correcting success rate calculations and fixing duplicate log counts to provide a more accurate, "greener" view of system health.
    *   I conducted performance analysis on slow requests, such as `/api/v2/workflow/asset_images`, and optimized the "Save" button processing, reducing latency from over two minutes to approximately 20 seconds for 50 images.
    *   I addressed data integrity issues, such as stripping carriage return characters from header fields in record management, and resolved 413/429 errors in the AI content removal service by coordinating frontend-side mitigation and infrastructure remediation.

### Collaborations, Mentorship, & Process Improvement

*   **Team Onboarding and Knowledge Sharing**
    *   I played a pivotal role in onboarding new team members by providing learning paths, setting up development environments, and scheduling 1-on-1 sessions to ensure they felt supported.
    *   I mentored team members by assigning growth-oriented tasks, conducting pair programming sessions, and providing clear, actionable guidance on Git workflows, such as rebasing feature branches.
    *   I championed the transition of the weekly Backend team meeting into a "Product Dive" session to improve long-term maintainability and reduce "bus factor" risks.
    *   I facilitated team cohesion by organizing welcome events and team outings, fostering a positive and inclusive environment.

*   **Refining Team Operations and Communication**
    *   I proposed and implemented a significant update to the daily scrum format, shifting to a "Yesterday/Today/Blockers" structure to reduce meeting overhead.
    *   I implemented a "round robin" system for PR reviewer assignments to ensure a balanced and efficient code review process, effectively mitigating bottlenecks.
    *   I took the initiative to organize and document sprint retrospectives and planning sessions in Notion, ensuring the team remained unblocked even during my absences.
    *   I acted as a primary release lead, managing staging and production cycles for the main web application and ensuring clear communication with Customer Support regarding verification items.

### Decisions, Infrastructure, & Technical Coordination

*   **Architectural Decision Making**
    *   I made the strategic decision to move away from Lambda for the content removal feature in favor of a GPU-based ECS setup, documenting this via Architecture Decision Records (ADR).
    *   I proposed the creation of a shared library to consolidate common functions like S3 image manipulation and resizing, aiming to reduce technical debt across future image-processing features.
    *   I implemented Lambda Layers for AI image processing lambdas to standardize deployment patterns and reduce redundancy across our monorepo.
    *   I managed administrative requests, such as requesting GitHub Team admin permissions to implement automatic PR reviewer assignments and updating IAM role policies for the Theme Selector feature.

*   **Infrastructure and Tooling Oversight**
    *   I demonstrated a high level of responsibility regarding cost management, such as reverting to standard AI models after feedback on high usage costs.
    *   I actively participated in the modernization of our infrastructure, including implementing Datadog monitors for Fluentd errors and optimizing Dependabot auto-merge workflows.
    *   I acted as a bridge between the Backend, Infrastructure, and ML teams, facilitating technical discussions and ensuring that infrastructure changes were properly audited and reviewed.

Throughout this period, I have consistently demonstrated a proactive and ownership-oriented mindset, successfully bridging the gap between high-level technical architecture and day-to-day team coordination. My ability to identify process bottlenecks and implement sustainable solutions—such as the round-robin review system and the migration of documentation to Notion—has significantly elevated the team's productivity. By fostering a culture of transparency, mentorship, and data-driven decision-making, I have not only advanced our current product roadmap but also contributed to the long-term sustainability and collaborative health of the engineering organization. I look forward to continuing this momentum by further refining our SLOs and driving the successful delivery of our upcoming AI-driven features.
```

---
> 🌐 *Traduit par Claude*
