/**
 * RESUME DATA - src/lib/resume-data.ts
 * =====================================
 *
 * Structured, multi-locale source of truth for the /[locale]/resume page.
 *
 * The content here is distilled from this repo: the recruiter brief in
 * `content/persona/*.md`, the career-story collection (Chapters 1-3), and the
 * daily/tech blog posts under `posts/en/`. UI labels (section headings, the
 * "Print" button, etc.) live in the dictionaries under the `resume` key — only
 * the actual resume *content* lives here.
 *
 * NOTE ON DATES: the blog narrates the career arc (Seido → Overflow →
 * Monstarlab → Spacely) but does not state exact transition months, so the year
 * ranges below are best-effort and should be confirmed/adjusted by Tony.
 */

import type { Locale } from "./i18n-config";

export interface ResumeProfile {
  name: string;
  title: string;
  location: string;
  email: string;
  github: string;
  githubLabel: string;
  website: string;
  websiteLabel: string;
  summary: string;
}

export interface ResumeExperience {
  company: string;
  role: string;
  period: string;
  location: string;
  /** Short context line about the company / product. */
  context: string;
  highlights: string[];
  stack: string[];
}

export interface ResumeProject {
  name: string;
  url?: string;
  description: string;
  stack: string[];
}

export interface ResumeSkillGroup {
  label: string;
  items: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  period: string;
  location: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ResumeLanguageEntry {
  language: string;
  level: string;
}

export interface ResumeData {
  profile: ResumeProfile;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: ResumeSkillGroup[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  languages: ResumeLanguageEntry[];
}

// ============================================================================
// ENGLISH
// ============================================================================

const en: ResumeData = {
  profile: {
    name: "Tony Duong",
    title: "Software Engineer ・ Backend / Full-Stack",
    location: "Tokyo, Japan",
    email: "tony.duong.102@gmail.com",
    github: "https://github.com/tonystrawberry",
    githubLabel: "github.com/tonystrawberry",
    website: "https://shirimono.fun",
    websiteLabel: "shirimono.fun",
    summary:
      "Full-stack engineer based in Tokyo with ~8 years building web applications end-to-end — Ruby on Rails backends, React/Next.js frontends, and the AWS infrastructure underneath. I like owning features from API to deploy, paying down the boring parts (observability, cost, test speed), and learning deeply — currently working through Designing Data-Intensive Applications and AWS certifications. Comfortable shipping in three languages, English, French, and Japanese.",
  },
  experience: [
    {
      company: "Spacely",
      role: "Software Engineer ・ Backend",
      period: "~2023 – Present",
      location: "Tokyo, Japan",
      context:
        "Backend team for an AI-driven image-processing product (panorama enhancement, generative editing for real-estate imagery).",
      highlights: [
        "Owned several AI image features end-to-end — generative content removal/placement and an AI contextual chat — building the CRUD APIs, file-attachment handling, and technical specs.",
        "Re-architected the panorama-enhancement pipeline from a Lambda CPU setup to an ECS GPU setup to meet response-time requirements, documenting the decision in an ADR.",
        "Cut a slow image endpoint from ~2 minutes to ~20 seconds for 50 images by optimizing the save flow, and resolved a production deadlock affecting the main web app.",
        "Organized ~120 Datadog monitors (consistent naming, ownership tags, ANOMALY/LATENCY categories) and added per-job error alerting; revamped SLO/SLI dashboards for accurate health reporting.",
        "Contributed to driving Honeybadger alerts down from ~9k to ~3.2k in two months by clearing a backlog of recurring exceptions.",
        "Built funnel/observability analytics on BigQuery and set up Claude Code GitHub Actions to auto-review Dependabot PRs.",
        "Improved team process: introduced ADRs, a round-robin PR-review rotation, and onboarding paths; mentored teammates through pairing and code review.",
      ],
      stack: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS (ECS, Lambda, S3, CloudFront)",
        "Datadog",
        "BigQuery",
        "GitHub Actions",
      ],
    },
    {
      company: "Monstarlab",
      role: "Software Engineer (Consulting)",
      period: "~2022 – 2023",
      location: "Tokyo, Japan",
      context:
        "Global digital consultancy delivering client web applications across varied stacks and domains.",
      highlights: [
        "Joined to broaden across clients, stacks, and problem domains after several years inside single-product teams.",
        "Delivered backend and full-stack work on client engagements, leaning on prior Rails and AWS experience to ramp quickly.",
      ],
      stack: ["Ruby on Rails", "AWS", "TypeScript", "PostgreSQL"],
    },
    {
      company: "Overflow",
      role: "Software Engineer",
      period: "~2020 – 2022 (~2.5 yrs)",
      location: "Ebisu, Tokyo, Japan",
      context:
        "First full-time engineer at a startup building Offers, a job-matching platform for engineers and designers.",
      highlights: [
        "Helped build Offers, a job-matching platform for engineers and designers, working day to day with product managers and designers to take features from idea to ship.",
        "Built a Slack integration that notified recruiters and job seekers in real time when a matching position came up.",
        "Worked on Offers Magazine, a digital engineering-and-design magazine: built the frontend in Vue.js from designer hand-offs (often HTML/CSS) wired to real data, and got hands-on with AWS CloudFront, WAF, and S3 plus a WordPress headless-CMS backend.",
        "Built a performant analytics tool on AWS Redshift, aggregating and extracting analytical data through complex SQL queries.",
        "Started out following the senior engineer's lead and quickly grew into an engineer who proposed solutions and designed new features, not just implemented them.",
        "Operated day to day in Japanese — spoken and written — making clear written communication a core strength; used Datadog and New Relic for observability.",
        "Promoted within the first year and recognized as a roughly top-5% performer; grew from shipping fast to shipping well under a strong mentor.",
      ],
      stack: ["Ruby on Rails", "Vue.js", "GraphQL", "AWS (CloudFront, WAF, S3, Redshift)", "Datadog", "New Relic"],
    },
    {
      company: "Seido",
      role: "Software Engineer",
      period: "2018 – ~2020",
      location: "Tokyo, Japan",
      context:
        "Sole developer at a seven-person e-commerce business (Japanese martial-arts gear), building internal tooling from scratch.",
      highlights: [
        "Built a shipment system integrating the Shopify API with DHL, Japan Post, and FedEx, plus a parcel-tracking dashboard that normalized each carrier's API into one view.",
        "Wrote accounting/revenue and tax-declaration tooling, Google Apps Script automations for the order pipeline, and Tampermonkey scripts to patch third-party UIs.",
        "Shipped daily on Rails + PostgreSQL on Heroku as a one-person engineering team — then used the tools in the warehouse myself, which Jordy (CEO) credited with measurably moving the company's productivity forward.",
      ],
      stack: ["Ruby on Rails", "PostgreSQL", "Heroku", "Shopify API", "Google Apps Script"],
    },
    {
      company: "Summit Tech",
      role: "Software Engineering Intern (VR)",
      period: "2017 – 2018 (4 mo)",
      location: "Montreal, Canada",
      context: "Telecoms company; master's internship.",
      highlights: [
        "Built a Unity VR game prototype integrating the company's internal video-call APIs, shipped as a client-facing demo alongside their telecoms platform.",
      ],
      stack: ["Unity", "C#"],
    },
  ],
  projects: [
    {
      name: "Shirimono",
      url: "https://shirimono.fun",
      description:
        "Japanese-learning app, rebuilt from scratch and shipped on the App Store. AI-generated exercises (Claude Skills), Vertex AI TTS audio, a JLPT N2 course, public multi-locale resource pages, and CloudFront-served assets. Migrated the backend from Render to a single Hetzner VPS with Kamal, saving ~$60/month.",
      stack: ["Ruby on Rails", "PostgreSQL", "Kamal", "Hetzner", "Vertex AI", "Claude"],
    },
    {
      name: "This site — blog + digital clone",
      url: "https://shirimono.fun",
      description:
        "A trilingual (fr/en/ja) Next.js 16 blog with a streaming Claude chat grounded in the site's content, a real-time ActionCable chat, and an automated translation pipeline (Claude Code + GitHub Actions) that translates new English posts into French and Japanese.",
      stack: ["Next.js 16", "TypeScript", "Tailwind CSS v4", "Claude", "Rails ActionCable"],
    },
    {
      name: "rails-openapi-generator",
      url: "https://github.com/tonystrawberry/rails-openapi-generator",
      description:
        "A Rails gem that generates complete OpenAPI documentation from source code, with first-class integration for the rails_param library. Built spec-first with spec-kit.",
      stack: ["Ruby", "Rails", "OpenAPI"],
    },
    {
      name: "tonystrawberry-mcp-server",
      url: "https://github.com/tonystrawberry/tonystrawberry-mcp-server",
      description:
        "A Ruby MCP (Model Context Protocol) server exposing tools that answer questions about me from Markdown profile files.",
      stack: ["Ruby", "MCP"],
    },
    {
      name: "brag-slack-cli",
      url: "https://github.com/tonystrawberry/brag-slack-cli",
      description:
        "A CLI that turns your Slack messages into accomplishment summaries for performance reviews.",
      stack: ["Ruby", "Slack API", "LLM"],
    },
    {
      name: "Axie Infinity gene overlay (earlier)",
      description:
        "A Tampermonkey extension that pulled each Axie's genes from the API and overlaid them on marketplace listings the site didn't expose. Shared in the game's Discord, it hit hundreds of downloads a day and ~$30/day at peak via a one-time Stripe unlock.",
      stack: ["JavaScript", "Tampermonkey", "Stripe"],
    },
  ],
  skills: [
    { label: "Backend", items: ["Ruby on Rails", "Ruby", "Node.js", "Python", "GraphQL", "REST APIs"] },
    { label: "Frontend", items: ["React", "Next.js", "Vue.js", "TypeScript", "JavaScript", "Tailwind CSS"] },
    { label: "Data", items: ["PostgreSQL", "MySQL", "Redis", "Redshift", "BigQuery"] },
    {
      label: "Cloud & Infra",
      items: ["AWS (ECS, Lambda, S3, CloudFront, RDS, Route 53, IAM)", "Docker", "Kamal", "Heroku", "Vercel"],
    },
    { label: "Observability", items: ["Datadog", "New Relic", "Honeybadger"] },
    { label: "AI & Tooling", items: ["Claude / Claude Code", "MCP", "Vertex AI", "RAG", "Spec-driven development"] },
    { label: "Practices", items: ["CI/CD (GitHub Actions)", "TDD / RSpec", "ADRs", "Code review", "i18n"] },
  ],
  education: [
    {
      school: "UTBM (France) ・ ÉTS Montréal (Canada)",
      degree: "Engineering double degree — Computer / Software Engineering (Master's level)",
      period: "2016 – 2018",
      location: "Belfort, France ・ Montreal, Canada",
    },
  ],
  certifications: [
    {
      name: "AWS Certified CloudOps Engineer – Associate",
      issuer: "Amazon Web Services",
      date: "2026",
      url: "https://www.credly.com/badges/c0552a82-3353-437f-816d-dd1200690026/public_url",
    },
  ],
  languages: [
    { language: "French", level: "Native" },
    { language: "English", level: "Fluent" },
    { language: "Japanese", level: "Conversational (works in Japanese daily)" },
  ],
};

// ============================================================================
// FRENCH
// ============================================================================

const fr: ResumeData = {
  profile: {
    name: "Tony Duong",
    title: "Ingénieur logiciel ・ Back-end / Full-stack",
    location: "Tokyo, Japon",
    email: "tony.duong.102@gmail.com",
    github: "https://github.com/tonystrawberry",
    githubLabel: "github.com/tonystrawberry",
    website: "https://shirimono.fun",
    websiteLabel: "shirimono.fun",
    summary:
      "Ingénieur full-stack basé à Tokyo, ~8 ans à construire des applications web de bout en bout — back-ends Ruby on Rails, front-ends React/Next.js et l'infrastructure AWS sous-jacente. J'aime porter une fonctionnalité de l'API au déploiement, m'occuper des parties ingrates (observabilité, coûts, vitesse des tests) et apprendre en profondeur — en ce moment Designing Data-Intensive Applications et les certifications AWS. À l'aise pour livrer en trois langues : anglais, français et japonais.",
  },
  experience: [
    {
      company: "Spacely",
      role: "Ingénieur logiciel ・ Back-end",
      period: "~2023 – aujourd'hui",
      location: "Tokyo, Japon",
      context:
        "Équipe back-end d'un produit de traitement d'images par IA (amélioration de panoramas, édition générative pour l'immobilier).",
      highlights: [
        "Pris en charge de bout en bout plusieurs fonctionnalités IA — suppression/placement de contenu génératif et un chat contextuel IA — en construisant les APIs CRUD, la gestion des pièces jointes et les spécifications techniques.",
        "Refonte du pipeline d'amélioration de panoramas d'une architecture Lambda CPU vers ECS GPU pour respecter les exigences de temps de réponse, décision documentée via un ADR.",
        "Réduit un endpoint lent de ~2 minutes à ~20 secondes pour 50 images en optimisant le flux de sauvegarde, et résolu un deadlock en production sur l'application principale.",
        "Organisé ~120 monitors Datadog (nommage cohérent, tags de responsabilité, catégories ANOMALY/LATENCY) et ajouté des alertes d'erreur par job ; refonte des dashboards SLO/SLI pour un suivi de santé fiable.",
        "Contribué à faire passer les alertes Honeybadger de ~9k à ~3,2k en deux mois en traitant un backlog d'exceptions récurrentes.",
        "Construit des analyses de funnel/observabilité sur BigQuery et mis en place des GitHub Actions Claude Code pour relire automatiquement les PR Dependabot.",
        "Amélioré les process de l'équipe : introduction des ADR, d'une rotation round-robin pour les revues de PR et de parcours d'onboarding ; mentorat via pair programming et revues de code.",
      ],
      stack: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS (ECS, Lambda, S3, CloudFront)",
        "Datadog",
        "BigQuery",
        "GitHub Actions",
      ],
    },
    {
      company: "Monstarlab",
      role: "Ingénieur logiciel (Conseil)",
      period: "~2022 – 2023",
      location: "Tokyo, Japon",
      context:
        "Cabinet de conseil digital international livrant des applications web clientes sur des stacks et domaines variés.",
      highlights: [
        "Rejoint pour m'ouvrir à différents clients, stacks et types de problèmes après plusieurs années en équipe mono-produit.",
        "Livré du travail back-end et full-stack sur des missions clients, en m'appuyant sur mon expérience Rails et AWS pour monter en charge rapidement.",
      ],
      stack: ["Ruby on Rails", "AWS", "TypeScript", "PostgreSQL"],
    },
    {
      company: "Overflow",
      role: "Ingénieur logiciel",
      period: "~2020 – 2022 (~2,5 ans)",
      location: "Ebisu, Tokyo, Japon",
      context:
        "Premier ingénieur à temps plein d'une startup développant Offers, une plateforme de mise en relation pour ingénieurs et designers.",
      highlights: [
        "Participé au développement d'Offers, une plateforme de mise en relation pour ingénieurs et designers, en travaillant au quotidien avec les product managers et les designers pour mener les fonctionnalités de l'idée à la livraison.",
        "Construit une intégration Slack qui notifiait en temps réel recruteurs et candidats dès qu'une offre correspondante apparaissait.",
        "Travaillé sur Offers Magazine, un magazine numérique d'ingénierie et de design : front-end développé en Vue.js à partir des maquettes des designers (souvent en HTML/CSS) branchées sur les vraies données, avec une prise en main d'AWS CloudFront, WAF et S3 et d'un back-end CMS headless sous WordPress.",
        "Construit un outil d'analyse performant sur AWS Redshift, agrégeant et extrayant des données analytiques via des requêtes SQL complexes.",
        "Démarré en suivant l'ingénieur senior, puis rapidement devenu un ingénieur qui proposait des solutions et concevait de nouvelles fonctionnalités, au-delà de la simple implémentation.",
        "Travail quotidien en japonais — à l'oral comme à l'écrit — la communication écrite claire devenant une force ; observabilité avec Datadog et New Relic.",
        "Promu dès la première année et reconnu parmi les ~5 % meilleurs ; passé de « livrer vite » à « livrer bien » sous un excellent mentor.",
      ],
      stack: ["Ruby on Rails", "Vue.js", "GraphQL", "AWS (CloudFront, WAF, S3, Redshift)", "Datadog", "New Relic"],
    },
    {
      company: "Seido",
      role: "Ingénieur logiciel",
      period: "2018 – ~2020",
      location: "Tokyo, Japon",
      context:
        "Seul développeur d'une société e-commerce de sept personnes (équipement d'arts martiaux japonais), construisant les outils internes de zéro.",
      highlights: [
        "Construit un système d'expédition intégrant l'API Shopify avec DHL, Japan Post et FedEx, plus un dashboard de suivi de colis normalisant l'API de chaque transporteur en une vue unique.",
        "Écrit des outils de comptabilité/chiffre d'affaires et de déclaration fiscale, des automatisations Google Apps Script pour le pipeline de commandes, et des scripts Tampermonkey pour corriger des UIs tierces.",
        "Livré quotidiennement sur Rails + PostgreSQL (Heroku) en tant qu'équipe d'une personne — puis utilisé moi-même ces outils à l'entrepôt, ce que le CEO (Jordy) a crédité d'un gain réel de productivité pour l'entreprise.",
      ],
      stack: ["Ruby on Rails", "PostgreSQL", "Heroku", "API Shopify", "Google Apps Script"],
    },
    {
      company: "Summit Tech",
      role: "Stagiaire ingénieur logiciel (VR)",
      period: "2017 – 2018 (4 mois)",
      location: "Montréal, Canada",
      context: "Entreprise de télécoms ; stage de master.",
      highlights: [
        "Construit un prototype de jeu VR sous Unity intégrant les APIs internes de visioconférence de l'entreprise, livré comme démo client aux côtés de leur plateforme télécoms.",
      ],
      stack: ["Unity", "C#"],
    },
  ],
  projects: [
    {
      name: "Shirimono",
      url: "https://shirimono.fun",
      description:
        "Application d'apprentissage du japonais, reconstruite de zéro et publiée sur l'App Store. Exercices générés par IA (Claude Skills), audio TTS via Vertex AI, un cours JLPT N2, des pages de ressources publiques multilingues et des assets servis par CloudFront. Backend migré de Render vers un seul VPS Hetzner avec Kamal, ~60 $/mois économisés.",
      stack: ["Ruby on Rails", "PostgreSQL", "Kamal", "Hetzner", "Vertex AI", "Claude"],
    },
    {
      name: "Ce site — blog + clone numérique",
      url: "https://shirimono.fun",
      description:
        "Un blog trilingue (fr/en/ja) en Next.js 16 avec un chat Claude en streaming ancré dans le contenu du site, un chat temps réel via ActionCable et un pipeline de traduction automatique (Claude Code + GitHub Actions) qui traduit les nouveaux articles anglais en français et japonais.",
      stack: ["Next.js 16", "TypeScript", "Tailwind CSS v4", "Claude", "Rails ActionCable"],
    },
    {
      name: "rails-openapi-generator",
      url: "https://github.com/tonystrawberry/rails-openapi-generator",
      description:
        "Une gem Rails qui génère une documentation OpenAPI complète à partir du code source, avec une intégration de premier ordre pour la librairie rails_param. Développée en spec-first avec spec-kit.",
      stack: ["Ruby", "Rails", "OpenAPI"],
    },
    {
      name: "tonystrawberry-mcp-server",
      url: "https://github.com/tonystrawberry/tonystrawberry-mcp-server",
      description:
        "Un serveur MCP (Model Context Protocol) en Ruby exposant des outils qui répondent aux questions me concernant à partir de fichiers de profil Markdown.",
      stack: ["Ruby", "MCP"],
    },
    {
      name: "brag-slack-cli",
      url: "https://github.com/tonystrawberry/brag-slack-cli",
      description:
        "Un CLI qui transforme vos messages Slack en résumés d'accomplissements pour les entretiens d'évaluation.",
      stack: ["Ruby", "API Slack", "LLM"],
    },
    {
      name: "Overlay de gènes Axie Infinity (plus tôt)",
      description:
        "Une extension Tampermonkey récupérant les gènes de chaque Axie via l'API pour les afficher sur les annonces du marketplace, données que le site n'exposait pas. Partagée sur le Discord du jeu, elle atteignait des centaines de téléchargements par jour et ~30 $/jour au pic via un déblocage Stripe unique.",
      stack: ["JavaScript", "Tampermonkey", "Stripe"],
    },
  ],
  skills: [
    { label: "Back-end", items: ["Ruby on Rails", "Ruby", "Node.js", "Python", "GraphQL", "APIs REST"] },
    { label: "Front-end", items: ["React", "Next.js", "Vue.js", "TypeScript", "JavaScript", "Tailwind CSS"] },
    { label: "Données", items: ["PostgreSQL", "MySQL", "Redis", "Redshift", "BigQuery"] },
    {
      label: "Cloud & Infra",
      items: ["AWS (ECS, Lambda, S3, CloudFront, RDS, Route 53, IAM)", "Docker", "Kamal", "Heroku", "Vercel"],
    },
    { label: "Observabilité", items: ["Datadog", "New Relic", "Honeybadger"] },
    { label: "IA & Outillage", items: ["Claude / Claude Code", "MCP", "Vertex AI", "RAG", "Spec-driven development"] },
    { label: "Pratiques", items: ["CI/CD (GitHub Actions)", "TDD / RSpec", "ADR", "Revue de code", "i18n"] },
  ],
  education: [
    {
      school: "UTBM (France) ・ ÉTS Montréal (Canada)",
      degree: "Double diplôme d'ingénieur — Génie informatique / logiciel (niveau Master)",
      period: "2016 – 2018",
      location: "Belfort, France ・ Montréal, Canada",
    },
  ],
  certifications: [
    {
      name: "AWS Certified CloudOps Engineer – Associate",
      issuer: "Amazon Web Services",
      date: "2026",
      url: "https://www.credly.com/badges/c0552a82-3353-437f-816d-dd1200690026/public_url",
    },
  ],
  languages: [
    { language: "Français", level: "Langue maternelle" },
    { language: "Anglais", level: "Courant" },
    { language: "Japonais", level: "Conversationnel (travail quotidien en japonais)" },
  ],
};

// ============================================================================
// JAPANESE
// ============================================================================

const ja: ResumeData = {
  profile: {
    name: "Tony Duong",
    title: "ソフトウェアエンジニア ・ バックエンド / フルスタック",
    location: "東京、日本",
    email: "tony.duong.102@gmail.com",
    github: "https://github.com/tonystrawberry",
    githubLabel: "github.com/tonystrawberry",
    website: "https://shirimono.fun",
    websiteLabel: "shirimono.fun",
    summary:
      "東京を拠点とするフルスタックエンジニア。約8年にわたり、Ruby on Rails のバックエンド、React/Next.js のフロントエンド、その下の AWS インフラまで含めて Web アプリケーションを一気通貫で開発してきました。API から本番デプロイまで機能を一人称で担当し、地味だが重要な部分（オブザーバビリティ、コスト、テスト速度）を整え、深く学ぶことを好みます（現在は Designing Data-Intensive Applications と AWS 認定に取り組み中）。英語・フランス語・日本語の3言語で開発できます。",
  },
  experience: [
    {
      company: "Spacely",
      role: "ソフトウェアエンジニア ・ バックエンド",
      period: "2023年頃 – 現在",
      location: "東京、日本",
      context:
        "AI による画像処理プロダクト（パノラマ補正、不動産画像の生成系編集）のバックエンドチーム。",
      highlights: [
        "生成系の不要物除去・配置や AI コンテキストチャットなど、複数の AI 機能を CRUD API・添付ファイル処理・技術仕様まで含めて一気通貫で担当。",
        "応答時間の要件を満たすため、パノラマ補正パイプラインを Lambda（CPU）構成から ECS（GPU）構成へ再設計し、ADR で意思決定を記録。",
        "保存処理を最適化し、画像50枚で約2分かかっていた遅いエンドポイントを約20秒に短縮。メインの Web アプリで発生していた本番のデッドロックも解消。",
        "約120個の Datadog モニターを整理（命名の統一、担当者タグ、ANOMALY/LATENCY などのカテゴリ付け）し、ジョブ単位のエラーアラートを追加。SLO/SLI ダッシュボードを刷新し、健全性を正確に可視化。",
        "再発する例外のバックログを解消し、Honeybadger のアラートを2か月で約9,000件から約3,200件まで削減することに貢献。",
        "BigQuery でファネル/オブザーバビリティ分析を構築し、Dependabot の PR を自動レビューする Claude Code の GitHub Actions を整備。",
        "チームのプロセスを改善：ADR の導入、PR レビューのラウンドロビン割り当て、オンボーディング手順の整備。ペアプロやコードレビューを通じてメンバーをメンタリング。",
      ],
      stack: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS (ECS, Lambda, S3, CloudFront)",
        "Datadog",
        "BigQuery",
        "GitHub Actions",
      ],
    },
    {
      company: "Monstarlab",
      role: "ソフトウェアエンジニア（コンサルティング）",
      period: "2022年頃 – 2023年",
      location: "東京、日本",
      context:
        "多様なスタック・領域でクライアントの Web アプリケーションを開発するグローバルなデジタルコンサルティング企業。",
      highlights: [
        "数年間の単一プロダクト開発を経て、さまざまなクライアント・スタック・課題に触れるために参画。",
        "これまでの Rails と AWS の経験を活かして素早く立ち上がり、クライアント案件のバックエンド・フルスタック開発を担当。",
      ],
      stack: ["Ruby on Rails", "AWS", "TypeScript", "PostgreSQL"],
    },
    {
      company: "Overflow",
      role: "ソフトウェアエンジニア",
      period: "2020年頃 – 2022年（約2.5年）",
      location: "東京・恵比寿、日本",
      context:
        "エンジニア・デザイナー向けの転職マッチングプラットフォーム「Offers」を開発するスタートアップの最初の正社員エンジニア。",
      highlights: [
        "Offers（エンジニア・デザイナー向けの転職マッチングプラットフォーム）の開発に参加。プロダクトマネージャーやデザイナーと日々連携し、アイデアからリリースまで機能を形にした。",
        "条件に合う求人が出た際に、リクルーターと求職者へリアルタイムで通知する Slack 連携を構築。",
        "Offers Magazine（エンジニアリングとデザインのデジタルマガジン）を担当。デザイナーから受け取るデザイン（多くは HTML/CSS）をもとにフロントエンドを Vue.js で開発し実データと接続。AWS CloudFront・WAF・S3 や WordPress をバックエンドとするヘッドレス CMS も実地で習得。",
        "AWS Redshift を用いた高性能な分析ツールを構築し、複雑な SQL クエリで分析データを集計・抽出。",
        "当初はシニアエンジニアの指示に従っていたが、ほどなく自ら解決策を提案し新機能を設計するエンジニアへと成長。",
        "日常業務を日本語（口頭・文章の両方）で行い、明確な文章コミュニケーションを強みに。Datadog・New Relic でオブザーバビリティに取り組む。",
        "入社1年目で昇進し、社内で上位約5%の評価を獲得。優れたメンターのもとで「速く作る」から「良いものを作る」へ成長。",
      ],
      stack: ["Ruby on Rails", "Vue.js", "GraphQL", "AWS (CloudFront, WAF, S3, Redshift)", "Datadog", "New Relic"],
    },
    {
      company: "Seido",
      role: "ソフトウェアエンジニア",
      period: "2018年 – 2020年頃",
      location: "東京、日本",
      context:
        "7人規模の EC 企業（日本の武道用品）で唯一の開発者として、社内ツールをゼロから構築。",
      highlights: [
        "Shopify API と DHL・日本郵便・FedEx を連携する出荷システムと、各配送業者の API を1つのビューに正規化する荷物追跡ダッシュボードを構築。",
        "会計/売上・確定申告ツール、受注パイプライン向けの Google Apps Script 自動化、サードパーティ UI を補正する Tampermonkey スクリプトを作成。",
        "一人のエンジニアチームとして Rails + PostgreSQL（Heroku）で日々リリースし、自ら倉庫でそのツールを使用。CEO の Jordy から会社の生産性を実際に押し上げたと評価された。",
      ],
      stack: ["Ruby on Rails", "PostgreSQL", "Heroku", "Shopify API", "Google Apps Script"],
    },
    {
      company: "Summit Tech",
      role: "ソフトウェアエンジニア インターン（VR）",
      period: "2017年 – 2018年（4か月）",
      location: "モントリオール、カナダ",
      context: "通信企業での修士インターンシップ。",
      highlights: [
        "社内のビデオ通話 API を組み込んだ Unity 製の VR ゲームのプロトタイプを構築し、通信プラットフォームと並ぶクライアント向けデモとして納品。",
      ],
      stack: ["Unity", "C#"],
    },
  ],
  projects: [
    {
      name: "Shirimono",
      url: "https://shirimono.fun",
      description:
        "ゼロから作り直し、App Store にリリースした日本語学習アプリ。AI による演習生成（Claude Skills）、Vertex AI の TTS 音声、JLPT N2 コース、多言語の公開リソースページ、CloudFront 配信のアセットを備える。バックエンドを Render から Hetzner の単一 VPS へ Kamal で移行し、月約60ドルを削減。",
      stack: ["Ruby on Rails", "PostgreSQL", "Kamal", "Hetzner", "Vertex AI", "Claude"],
    },
    {
      name: "このサイト — ブログ + デジタルクローン",
      url: "https://shirimono.fun",
      description:
        "Next.js 16 製の3言語（fr/en/ja）ブログ。サイトの内容に基づく Claude のストリーミングチャット、ActionCable によるリアルタイムチャット、新しい英語記事をフランス語・日本語へ自動翻訳するパイプライン（Claude Code + GitHub Actions）を備える。",
      stack: ["Next.js 16", "TypeScript", "Tailwind CSS v4", "Claude", "Rails ActionCable"],
    },
    {
      name: "rails-openapi-generator",
      url: "https://github.com/tonystrawberry/rails-openapi-generator",
      description:
        "ソースコードから完全な OpenAPI ドキュメントを生成する Rails gem。rails_param ライブラリと密に統合。spec-kit を用いてスペックファーストで開発。",
      stack: ["Ruby", "Rails", "OpenAPI"],
    },
    {
      name: "tonystrawberry-mcp-server",
      url: "https://github.com/tonystrawberry/tonystrawberry-mcp-server",
      description:
        "Markdown のプロフィールファイルをもとに私に関する質問へ回答するツールを公開する Ruby 製の MCP（Model Context Protocol）サーバー。",
      stack: ["Ruby", "MCP"],
    },
    {
      name: "brag-slack-cli",
      url: "https://github.com/tonystrawberry/brag-slack-cli",
      description:
        "Slack のメッセージを人事評価向けの成果サマリーに変換する CLI。",
      stack: ["Ruby", "Slack API", "LLM"],
    },
    {
      name: "Axie Infinity 遺伝子オーバーレイ（以前）",
      description:
        "各 Axie の遺伝子情報を API から取得し、サイトが表示していなかったマーケットプレイスの一覧に重ねて表示する Tampermonkey 拡張。ゲームの Discord で共有し、1日あたり数百ダウンロード、ピーク時には Stripe の買い切り解除で1日約30ドルを記録。",
      stack: ["JavaScript", "Tampermonkey", "Stripe"],
    },
  ],
  skills: [
    { label: "バックエンド", items: ["Ruby on Rails", "Ruby", "Node.js", "Python", "GraphQL", "REST API"] },
    { label: "フロントエンド", items: ["React", "Next.js", "Vue.js", "TypeScript", "JavaScript", "Tailwind CSS"] },
    { label: "データ", items: ["PostgreSQL", "MySQL", "Redis", "Redshift", "BigQuery"] },
    {
      label: "クラウド & インフラ",
      items: ["AWS (ECS, Lambda, S3, CloudFront, RDS, Route 53, IAM)", "Docker", "Kamal", "Heroku", "Vercel"],
    },
    { label: "オブザーバビリティ", items: ["Datadog", "New Relic", "Honeybadger"] },
    { label: "AI & ツール", items: ["Claude / Claude Code", "MCP", "Vertex AI", "RAG", "スペック駆動開発"] },
    { label: "プラクティス", items: ["CI/CD (GitHub Actions)", "TDD / RSpec", "ADR", "コードレビュー", "i18n"] },
  ],
  education: [
    {
      school: "UTBM（フランス）・ ÉTS モントリオール（カナダ）",
      degree: "ダブルディグリー（工学）— コンピュータ / ソフトウェア工学（修士相当）",
      period: "2016年 – 2018年",
      location: "ベルフォール（仏）・ モントリオール（加）",
    },
  ],
  certifications: [
    {
      name: "AWS Certified CloudOps Engineer – Associate",
      issuer: "Amazon Web Services",
      date: "2026年",
      url: "https://www.credly.com/badges/c0552a82-3353-437f-816d-dd1200690026/public_url",
    },
  ],
  languages: [
    { language: "フランス語", level: "母語" },
    { language: "英語", level: "流暢" },
    { language: "日本語", level: "日常会話（業務は日本語で対応）" },
  ],
};

export const resumeData: Record<Locale, ResumeData> = { en, fr, ja };
