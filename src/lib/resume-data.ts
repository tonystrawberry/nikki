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
  linkedin: string;
  linkedinLabel: string;
  website: string;
  websiteLabel: string;
  blog: string;
  blogLabel: string;
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
  /** True for lapsed certifications (still listed, visually marked). */
  expired?: boolean;
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
    location: "Toulouse, France",
    email: "tony.duong.102@gmail.com",
    github: "https://github.com/tonystrawberry",
    githubLabel: "github.com/tonystrawberry",
    linkedin: "https://www.linkedin.com/in/tony-duong-tokyo/",
    linkedinLabel: "linkedin.com/in/tony-duong-tokyo",
    website: "https://shirimono.fun",
    websiteLabel: "shirimono.fun",
    blog: "https://shirimono.fun/en",
    blogLabel: "shirimono.fun/en",
    summary:
      'Full-stack engineer who is <span class="text-primary">curious</span>, <span class="text-primary">organized</span>, and <span class="text-primary">proactive</span>, with <span class="text-primary">strong backend proficiency</span> and <span class="text-primary">~8 years</span> of experience building web applications end-to-end — <span class="text-primary">Ruby on Rails</span> backends, <span class="text-primary">React/Next.js</span> frontends, and the <span class="text-primary">AWS</span> infrastructure underneath. Comfortable shipping in <span class="text-primary">English, French, and Japanese</span>.',
  },
  experience: [
    {
      company: "Spacely",
      role: "Senior Backend Engineer → Team Lead",
      period: "~2025 – Present",
      location: "Tokyo, Japan → Toulouse, France (part-time freelance since Jun 2026)",
      context:
        "Five-person backend team for a B2B cloud VR platform (real estate / housing) — turning photos and 3D data into immersive 360° panoramic content for 1,000+ companies.",
      highlights: [
        '<span class="text-primary">Promoted to Team Lead in about a year</span> on a <span class="text-primary">five-person backend team</span>; onboard new members, lead meetings, and reshape team rituals — cut unnecessary recurring meetings and revitalized the weekly "Product Dive" knowledge-sharing session.',
        '<span class="text-primary">Most awards nominations company-wide for the 2025–2026 period</span> — the employee with the highest number of nomination submissions across the organization.',
        "Made a core production job <span class=\"text-primary\">~4× faster</span> — a CPU-heavy 360°-to-cubemap conversion run <span class=\"text-primary\">10,000+ times a day</span> — by moving it off shared Sidekiq workers onto <span class=\"text-primary\">AWS Lambda</span>; optimized the save flow so a single job dropped from <span class=\"text-primary\">~2 minutes to ~10 seconds</span> and a 50-image batch from <span class=\"text-primary\">~12 minutes to under 2</span>.",
        "Cut Honeybadger error alerts from <span class=\"text-primary\">~10,000 to under 300</span> in a <span class=\"text-primary\">two-week</span> window through focused debugging and bug-fixing.",
        "Built a custom <span class=\"text-primary\">Jira app</span> for burndown and velocity charts — aggregating multiple DONE statuses and sprint-point fields across several Jira workspaces that default Jira couldn't configure.",
        "Led a <span class=\"text-primary\">vulnerability assessment</span> end to end — evaluating security firms, scoping, and running the engagement — partly as the fastest route to a bird's-eye view of the codebase.",
        "Upgraded <span class=\"text-primary\">Rails 7.1 → 7.2</span> across a multi-database setup, repairing the many cross-database tests it broke along the way.",
        "Detected <span class=\"text-primary\">data inconsistencies</span> (e.g. duplicates) in production — analyzed the full dataset, applied remediation scripts, and added validations, business rules, and indexes to prevent recurrence.",
        "Owned several <span class=\"text-primary\">AI image features</span> end-to-end — generative content removal/placement and an AI contextual chat — building CRUD APIs, file-attachment handling, and technical specs; re-architected the panorama-enhancement pipeline from <span class=\"text-primary\">Lambda (CPU) to ECS (GPU)</span>.",
        "Led infrastructure and system-design work on AWS — <span class=\"text-primary\">Step Functions, Lambda, API Gateway, ECS</span>, and the ALB/VPC networking layer.",
        "Automated <span class=\"text-primary\">API specification generation</span> directly from source code, replacing a hand-maintained spec in a separate repo; migrated team documentation from <span class=\"text-primary\">Qiita to Notion</span>.",
        "Overhauled <span class=\"text-primary\">Datadog</span> observability — <span class=\"text-primary\">~120 monitors</span> with consistent naming, ownership tags, and runbooks; rebuilt SLO/SLI dashboards and normalized <span class=\"text-primary\">50+ alerts</span>.",
        "Established team coding rules (now embedded in <span class=\"text-primary\">AGENTS.md</span> files) and helped weave AI into nearly every stage of the development workflow; perform safe weekly dependency upgrades using spec-driven development.",
        'Represented Spacely in a <a href="https://www.tokyodev.com/companies/spacely/interviews/tony-duong" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">TokyoDev interview</a>; wrote four articles for the company tech blog: <a href="https://tech.spacely.co.jp/entry/2026/06/10/163831" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">360° cubemap ~4× faster (Sidekiq → Lambda)</a>, <a href="https://tech.spacely.co.jp/entry/2026/04/24/163036" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">lost updates in Rails</a>, <a href="https://tech.spacely.co.jp/entry/2025/07/04/141254" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Cursor productivity</a>, <a href="https://tech.spacely.co.jp/entry/2025/10/28/101247" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Rails 7.1 → 7.2 upgrade</a>.',
      ],
      stack: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS (Step Functions, Lambda, API Gateway, ECS, S3, CloudFront)",
        "Datadog",
        "Honeybadger",
        "BigQuery",
        "GitHub Actions",
      ],
    },
    {
      company: "Monstarlab",
      role: "Senior Backend Engineer → Tech Lead (Consulting)",
      period: "~2022 – 2024 (~2.5 yrs)",
      location: "Tokyo, Japan (remote from Enoshima)",
      context:
        "Global digital consultancy — client engagements across varied stacks and domains; joined as Senior Backend Engineer (Ruby), promoted to Tech Lead after ~1 year.",
      highlights: [
        "Stepped up as backend lead on a project for a <span class=\"text-primary\">major Japanese automobile company</span> when teammates rolled off, and saw it through to delivery over roughly <span class=\"text-primary\">six months</span>.",
        "Recovered overwritten production data using <span class=\"text-primary\">Aurora Point-in-Time Recovery</span> after a deployment mistake — and learned the discipline that makes sure it never happens twice.",
        "Built a <span class=\"text-primary\">ChatGPT-powered RAG chatbot</span> prototype for a major Japanese conglomerate, working alongside an AI engineer with <span class=\"text-primary\">Amazon Lex and Amazon Connect</span>, fully provisioned in <span class=\"text-primary\">Terraform</span>.",
        "Earned around <a href=\"#certifications\" class=\"text-primary hover:underline\">seven AWS certifications</a> through Monstarlab's certification support — theoretical grounding that's paid dividends ever since.",
        "Led an <span class=\"text-primary\">eight-engineer backend team</span> across the Tokyo and Vietnam offices on a from-scratch build for a demanding, high-standards client — balancing quality against a tight schedule and shipping the release on time.",
        "Worked in a <span class=\"text-primary\">schema-first, three-layer architecture</span> — a GraphQL BFF between the frontend and a Ruby on Rails gRPC backend, with code generated on both sides from shared proto schemas.",
        "Built a reservation system integrated with <span class=\"text-primary\">Google Calendar</span> (availability checks and slot booking) on top of complex application-side rules — roles, smart attendee assignment, and constrained sets of possible times.",
        "Built an analytics feature on <span class=\"text-primary\">Google BigQuery (OLAP)</span> — daily, weekly, and three-month views — with a daily aggregation job loading results back into the OLTP store for fast reads.",
      ],
      stack: [
        "Ruby on Rails",
        "gRPC",
        "GraphQL",
        "Terraform",
        "AWS (Aurora, Lex, Connect, ECS, RDS)",
        "BigQuery",
        "Google Calendar API",
      ],
    },
    {
      company: "Overflow",
      role: "Software Engineer",
      period: "~2020 – 2022 (~2.5 yrs)",
      location: "Ebisu, Tokyo, Japan",
      context:
        "First full-time engineer at a startup building Offers, a job-matching platform for engineers and designers.",
      highlights: [
        "Helped build <span class=\"text-primary\">Offers</span>, a job-matching platform for engineers and designers, working day to day with product managers and designers to take features from idea to ship.",
        "Built a <span class=\"text-primary\">Slack integration</span> that notified recruiters and job seekers in real time when a matching position came up.",
        "Worked on <span class=\"text-primary\">Offers Magazine</span>, a digital engineering-and-design magazine: built the frontend in <span class=\"text-primary\">Vue.js</span> from designer hand-offs (often HTML/CSS) wired to real data, and got hands-on with <span class=\"text-primary\">AWS CloudFront, WAF, and S3</span> plus a WordPress headless-CMS backend.",
        "Built a performant analytics tool on <span class=\"text-primary\">AWS Redshift</span>, aggregating and extracting analytical data through complex SQL queries.",
        "Started out following the senior engineer's lead and quickly grew into an engineer who proposed solutions and designed new features, not just implemented them.",
        "Operated day to day in <span class=\"text-primary\">Japanese</span> — spoken and written — making clear written communication a core strength; used <span class=\"text-primary\">Datadog and New Relic</span> for observability.",
        "Promoted within the <span class=\"text-primary\">first year</span> and recognized as a roughly <span class=\"text-primary\">top-5% performer</span>; grew from shipping fast to shipping well under a strong mentor.",
      ],
      stack: ["Ruby on Rails", "Vue.js", "GraphQL", "AWS (CloudFront, WAF, S3, Redshift)", "Datadog", "New Relic"],
    },
    {
      company: "Seido",
      role: "Software Engineering Intern → Software Engineer",
      period: "2018 – ~2020",
      location: "Tokyo, Japan",
      context:
        "Started as an intern, then offered a permanent full-time contract. Sole developer at a seven-person e-commerce business (Japanese martial-arts gear), building internal tooling from scratch.",
      highlights: [
        "Built a shipment system integrating the <span class=\"text-primary\">Shopify API</span> with <span class=\"text-primary\">DHL, Japan Post, and FedEx</span>, plus a parcel-tracking dashboard that normalized each carrier's API into one view.",
        "Wrote accounting/revenue and tax-declaration tooling, <span class=\"text-primary\">Google Apps Script</span> automations for the order pipeline, and Tampermonkey scripts to patch third-party UIs.",
        "Shipped daily on <span class=\"text-primary\">Rails + PostgreSQL on Heroku</span> as a <span class=\"text-primary\">one-person engineering team</span> — then used the tools in the warehouse myself, which Jordy (CEO) credited with measurably moving the company's productivity forward.",
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
        "Built a <span class=\"text-primary\">Unity VR game prototype</span> integrating the company's internal video-call APIs, shipped as a client-facing demo alongside their telecoms platform.",
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
      name: "Axie Infinity gene overlay (earlier)",
      description:
        "A Chrome and Firefox browser extension that pulled each Axie's genes from the API and overlaid them on marketplace listings the site didn't expose. Shared in the game's Discord, it hit hundreds of downloads a day and ~$30/day at peak via a one-time Stripe unlock.",
      stack: ["JavaScript", "Chrome Extension", "Firefox Extension", "Stripe"],
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
    { label: "Practices", items: ["CI/CD (GitHub Actions)", "TDD / RSpec", "Code review", "i18n"] },
  ],
  education: [
    {
      school: "UTBM (France) ・ ÉTS Montréal (Canada)",
      degree: "Engineering double degree — Computer / Software Engineering (Master's level)",
      period: "2016 – 2018",
      location: "Belfort, France ・ Montreal, Canada",
    },
    {
      school: "UTBM (Université de Technologie de Belfort-Montbéliard)",
      degree: "Engineering — Computer / Software Engineering",
      period: "2014 – 2016",
      location: "Belfort, France",
    },
    {
      school: "IUT de Toulouse",
      degree: "DUT Informatique (2-year technical degree)",
      period: "2012 – 2014",
      location: "Toulouse, France",
    },
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect – Professional", issuer: "Amazon Web Services", date: "Aug 2023", url: "https://www.credly.com/badges/78b0a1d5-fd0e-4bb4-a111-e94977cc4649/public_url" },
    { name: "AWS Certified DevOps Engineer – Professional", issuer: "Amazon Web Services", date: "Nov 2023", url: "https://www.credly.com/badges/ec94c0fe-075f-4be2-a289-1fc42dfe2cf7/public_url" },
    { name: "AWS Certified CloudOps Engineer – Associate", issuer: "Amazon Web Services", date: "Apr 2026", url: "https://www.credly.com/badges/c0552a82-3353-437f-816d-dd1200690026/public_url" },
    { name: "AWS Certified Data Engineer – Associate", issuer: "Amazon Web Services", date: "Aug 2024", url: "https://www.credly.com/badges/b2fe9b9a-7d30-47d5-ad06-d6a13d76ad59/public_url" },
    { name: "AWS Certified AI Practitioner (Early Adopter)", issuer: "Amazon Web Services", date: "Aug 2024", url: "https://www.credly.com/badges/d400ddf2-d889-4d55-87ce-7d1967cb2d63/public_url" },
    { name: "AWS Certified SysOps Administrator – Associate", issuer: "Amazon Web Services", date: "Apr 2023", url: "https://www.credly.com/badges/c6d76950-27c5-4f66-8be2-4e1db8f044b3/public_url", expired: true },
    { name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", date: "Mar 2023", url: "https://www.credly.com/badges/285ae003-e487-4175-b1b2-f86e6e2386cc/public_url", expired: true },
    { name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "Feb 2023", url: "https://www.credly.com/badges/cbd4778c-044f-4b84-a1b8-9e3bebabcbec/public_url", expired: true },
    { name: "HashiCorp Certified: Terraform Associate (003)", issuer: "HashiCorp", date: "Aug 2023", url: "https://www.credly.com/badges/768429a5-a6fe-4ba6-b82b-91ff97e8dc14/public_url", expired: true },
    { name: "AWS Certified Cloud Practitioner (CLF-C01)", issuer: "Amazon Web Services", date: "Dec 2022", url: "https://www.credly.com/badges/6f52dbc7-f604-483a-9e48-510114d0955c/public_url", expired: true },
  ],
  languages: [
    { language: "French", level: "Native" },
    { language: "English", level: "Fluent" },
    { language: "Japanese", level: "Business (working in Japanese daily since 2018)" },
  ],
};

// ============================================================================
// FRENCH
// ============================================================================

const fr: ResumeData = {
  profile: {
    name: "Tony Duong",
    title: "Ingénieur logiciel ・ Back-end / Full-stack",
    location: "Toulouse, France",
    email: "tony.duong.102@gmail.com",
    github: "https://github.com/tonystrawberry",
    githubLabel: "github.com/tonystrawberry",
    linkedin: "https://www.linkedin.com/in/tony-duong-tokyo/",
    linkedinLabel: "linkedin.com/in/tony-duong-tokyo",
    website: "https://shirimono.fun",
    websiteLabel: "shirimono.fun",
    blog: "https://shirimono.fun/fr",
    blogLabel: "shirimono.fun/fr",
    summary:
      'Ingénieur full-stack <span class="text-primary">curieux</span>, <span class="text-primary">organisé</span> et <span class="text-primary">proactif</span>, avec une <span class="text-primary">forte maîtrise du back-end</span> et <span class="text-primary">~8 ans</span> d\'expérience à construire des applications web de bout en bout — back-ends <span class="text-primary">Ruby on Rails</span>, front-ends <span class="text-primary">React/Next.js</span> et l\'infrastructure <span class="text-primary">AWS</span> sous-jacente. À l\'aise pour livrer en <span class="text-primary">anglais, français et japonais</span>.',
  },
  experience: [
    {
      company: "Spacely",
      role: "Ingénieur back-end senior → Team Lead",
      period: "~2025 – aujourd'hui",
      location: "Tokyo, Japon → Toulouse, France (freelance à temps partiel depuis juin 2026)",
      context:
        "Équipe back-end de cinq personnes sur une plateforme VR cloud B2B (immobilier / logement) — transformation de photos et de données 3D en contenus panoramiques 360° immersifs pour plus de 1 000 entreprises.",
      highlights: [
        '<span class="text-primary">Promu Team Lead en environ un an</span> au sein d\'une <span class="text-primary">équipe back-end de cinq personnes</span> ; onboarding des nouveaux membres, animation des réunions et refonte des rituels d\'équipe — suppression des réunions récurrentes inutiles et relance du "Product Dive" hebdomadaire de partage de connaissances.',
        '<span class="text-primary">Le plus de nominations aux awards company-wide sur la période 2025–2026</span> — l\'employé ayant soumis le plus grand nombre de nominations dans l\'organisation.',
        "Accéléré <span class=\"text-primary\">~4×</span> un job de production critique — conversion 360°→cubemap CPU-intensive, exécuté <span class=\"text-primary\">plus de 10 000 fois par jour</span> — en le sortant des workers Sidekiq partagés vers <span class=\"text-primary\">AWS Lambda</span> ; optimisé le flux de sauvegarde pour passer de <span class=\"text-primary\">~2 minutes à ~10 secondes</span> par job et de <span class=\"text-primary\">~12 minutes à moins de 2</span> pour un lot de 50 images.",
        "Réduit les alertes Honeybadger de <span class=\"text-primary\">~10 000 à moins de 300</span> en <span class=\"text-primary\">deux semaines</span> grâce à du debugging ciblé et à la correction de bugs.",
        "Construit une <span class=\"text-primary\">app Jira</span> sur mesure pour les burndown et velocity charts — agrégation de plusieurs statuts DONE et champs de story points sur plusieurs espaces Jira que Jira natif ne permettait pas de configurer.",
        "Piloté une <span class=\"text-primary\">évaluation de vulnérabilités</span> de bout en bout — sélection de cabinets, cadrage et exécution — en partie comme moyen le plus rapide d'avoir une vue d'ensemble du codebase.",
        "Migré <span class=\"text-primary\">Rails 7.1 → 7.2</span> sur une architecture multi-bases, en réparant les nombreux tests cross-database cassés en cours de route.",
        "Détecté des <span class=\"text-primary\">incohérences de données</span> (ex. doublons) en production — analysé l'ensemble du dataset, appliqué des scripts de correction, et ajouté validations, règles métier et index pour prévenir les récidives.",
        "Pris en charge de bout en bout plusieurs <span class=\"text-primary\">fonctionnalités IA</span> — suppression/placement génératif et chat contextuel IA — (APIs CRUD, pièces jointes, specs) ; refonte du pipeline d'amélioration de panoramas de <span class=\"text-primary\">Lambda (CPU) vers ECS (GPU)</span>.",
        "Piloté l'infrastructure et le system design sur AWS — <span class=\"text-primary\">Step Functions, Lambda, API Gateway, ECS</span> et le réseau ALB/VPC.",
        "Automatisé la <span class=\"text-primary\">génération de la spec API</span> directement depuis le code source, remplaçant une spec maintenue à la main dans un repo séparé ; migré la documentation d'équipe de <span class=\"text-primary\">Qiita vers Notion</span>.",
        "Refonte de l'observabilité <span class=\"text-primary\">Datadog</span> — <span class=\"text-primary\">~120 monitors</span> avec nommage cohérent, tags de responsabilité et runbooks ; dashboards SLO/SLI reconstruits et <span class=\"text-primary\">50+ alertes</span> normalisées.",
        "Établi des règles de code d'équipe (désormais dans les fichiers <span class=\"text-primary\">AGENTS.md</span>) et intégré l'IA dans presque toutes les étapes du workflow ; mises à jour hebdomadaires de dépendances en spec-driven development.",
        'Représenté Spacely dans une <a href="https://www.tokyodev.com/companies/spacely/interviews/tony-duong" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">interview TokyoDev</a> ; rédigé quatre articles pour le blog tech : <a href="https://tech.spacely.co.jp/entry/2026/06/10/163831" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">cubemap 360° ~4× plus rapide (Sidekiq → Lambda)</a>, <a href="https://tech.spacely.co.jp/entry/2026/04/24/163036" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">lost updates en Rails</a>, <a href="https://tech.spacely.co.jp/entry/2025/07/04/141254" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">productivité avec Cursor</a>, <a href="https://tech.spacely.co.jp/entry/2025/10/28/101247" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">upgrade Rails 7.1 → 7.2</a>.',
      ],
      stack: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS (Step Functions, Lambda, API Gateway, ECS, S3, CloudFront)",
        "Datadog",
        "Honeybadger",
        "BigQuery",
        "GitHub Actions",
      ],
    },
    {
      company: "Monstarlab",
      role: "Ingénieur back-end senior → Tech Lead (Conseil)",
      period: "~2022 – 2024 (~2,5 ans)",
      location: "Tokyo, Japon (remote depuis Enoshima)",
      context:
        "Cabinet de conseil digital international — missions clients sur des stacks et domaines variés ; arrivée en Senior Backend Engineer (Ruby), promotion Tech Lead après ~1 an.",
      highlights: [
        "Pris la tête du back-end sur un projet pour un <span class=\"text-primary\">grand constructeur automobile japonais</span> lorsque des membres sont partis, et livré le projet en <span class=\"text-primary\">~6 mois</span>.",
        "Récupéré des données de production écrasées via <span class=\"text-primary\">Aurora Point-in-Time Recovery</span> après une erreur de déploiement — et adopté la discipline pour que cela ne se reproduise plus.",
        "Construit un prototype de <span class=\"text-primary\">chatbot RAG alimenté par ChatGPT</span> pour un grand conglomérat japonais, aux côtés d'un ingénieur IA, avec <span class=\"text-primary\">Amazon Lex et Amazon Connect</span>, entièrement provisionné en <span class=\"text-primary\">Terraform</span>.",
        "Obtenu environ <a href=\"#certifications\" class=\"text-primary hover:underline\">sept certifications AWS</a> grâce au programme de l'entreprise — un socle théorique qui paie encore aujourd'hui.",
        "Mené une équipe back-end de <span class=\"text-primary\">huit ingénieurs</span> entre Tokyo et le Vietnam sur un build from scratch pour un client exigeant — équilibre qualité/délai et livraison dans les temps.",
        "Travaillé dans une <span class=\"text-primary\">architecture schema-first en trois couches</span> — BFF GraphQL entre le front et un back-end Ruby on Rails gRPC, code généré des deux côtés à partir de schémas proto partagés.",
        "Construit un système de réservation intégré à <span class=\"text-primary\">Google Calendar</span> (vérification de disponibilité et réservation de créneaux) avec des règles applicatives complexes — rôles, assignation intelligente des participants et contraintes horaires.",
        "Construit une fonctionnalité d'analytics sur <span class=\"text-primary\">Google BigQuery (OLAP)</span> — vues journalières, hebdomadaires et sur trois mois — avec un job d'agrégation quotidien rechargeant l'OLTP pour des lectures rapides.",
      ],
      stack: [
        "Ruby on Rails",
        "gRPC",
        "GraphQL",
        "Terraform",
        "AWS (Aurora, Lex, Connect, ECS, RDS)",
        "BigQuery",
        "Google Calendar API",
      ],
    },
    {
      company: "Overflow",
      role: "Ingénieur logiciel",
      period: "~2020 – 2022 (~2,5 ans)",
      location: "Ebisu, Tokyo, Japon",
      context:
        "Premier ingénieur à temps plein d'une startup développant Offers, une plateforme de mise en relation pour ingénieurs et designers.",
      highlights: [
        "Participé au développement d'<span class=\"text-primary\">Offers</span>, une plateforme de mise en relation pour ingénieurs et designers, en travaillant au quotidien avec les product managers et les designers pour mener les fonctionnalités de l'idée à la livraison.",
        "Construit une <span class=\"text-primary\">intégration Slack</span> qui notifiait en temps réel recruteurs et candidats dès qu'une offre correspondante apparaissait.",
        "Travaillé sur <span class=\"text-primary\">Offers Magazine</span>, un magazine numérique d'ingénierie et de design : front-end développé en <span class=\"text-primary\">Vue.js</span> à partir des maquettes des designers (souvent en HTML/CSS) branchées sur les vraies données, avec une prise en main d'<span class=\"text-primary\">AWS CloudFront, WAF et S3</span> et d'un back-end CMS headless sous WordPress.",
        "Construit un outil d'analyse performant sur <span class=\"text-primary\">AWS Redshift</span>, agrégeant et extrayant des données analytiques via des requêtes SQL complexes.",
        "Démarré en suivant l'ingénieur senior, puis rapidement devenu un ingénieur qui proposait des solutions et concevait de nouvelles fonctionnalités, au-delà de la simple implémentation.",
        "Travail quotidien en <span class=\"text-primary\">japonais</span> — à l'oral comme à l'écrit — la communication écrite claire devenant une force ; observabilité avec <span class=\"text-primary\">Datadog et New Relic</span>.",
        "Promu dès la <span class=\"text-primary\">première année</span> et reconnu parmi les <span class=\"text-primary\">~5 % meilleurs</span> ; passé de « livrer vite » à « livrer bien » sous un excellent mentor.",
      ],
      stack: ["Ruby on Rails", "Vue.js", "GraphQL", "AWS (CloudFront, WAF, S3, Redshift)", "Datadog", "New Relic"],
    },
    {
      company: "Seido",
      role: "Stagiaire ingénieur logiciel → ingénieur logiciel",
      period: "2018 – ~2020",
      location: "Tokyo, Japon",
      context:
        "Arrivé en stagiaire, puis embauché en CDI temps plein. Seul développeur d'une société e-commerce de sept personnes (équipement d'arts martiaux japonais), construisant les outils internes de zéro.",
      highlights: [
        "Construit un système d'expédition intégrant l'<span class=\"text-primary\">API Shopify</span> avec <span class=\"text-primary\">DHL, Japan Post et FedEx</span>, plus un dashboard de suivi de colis normalisant l'API de chaque transporteur en une vue unique.",
        "Écrit des outils de comptabilité/chiffre d'affaires et de déclaration fiscale, des automatisations <span class=\"text-primary\">Google Apps Script</span> pour le pipeline de commandes, et des scripts Tampermonkey pour corriger des UIs tierces.",
        "Livré quotidiennement sur <span class=\"text-primary\">Rails + PostgreSQL (Heroku)</span> en tant qu'<span class=\"text-primary\">équipe d'une personne</span> — puis utilisé moi-même ces outils à l'entrepôt, ce que le CEO (Jordy) a crédité d'un gain réel de productivité pour l'entreprise.",
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
        "Construit un prototype de <span class=\"text-primary\">jeu VR Unity</span> intégrant les APIs internes de visioconférence de l'entreprise, livré comme démo client aux côtés de leur plateforme télécoms.",
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
      name: "Overlay de gènes Axie Infinity (plus tôt)",
      description:
        "Une extension navigateur Chrome et Firefox récupérant les gènes de chaque Axie via l'API pour les afficher sur les annonces du marketplace, données que le site n'exposait pas. Partagée sur le Discord du jeu, elle atteignait des centaines de téléchargements par jour et ~30 $/jour au pic via un déblocage Stripe unique.",
      stack: ["JavaScript", "Extension Chrome", "Extension Firefox", "Stripe"],
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
    { label: "Pratiques", items: ["CI/CD (GitHub Actions)", "TDD / RSpec", "Revue de code", "i18n"] },
  ],
  education: [
    {
      school: "UTBM (France) ・ ÉTS Montréal (Canada)",
      degree: "Double diplôme d'ingénieur — Génie informatique / logiciel (niveau Master)",
      period: "2016 – 2018",
      location: "Belfort, France ・ Montréal, Canada",
    },
    {
      school: "UTBM (Université de Technologie de Belfort-Montbéliard)",
      degree: "Cycle ingénieur — Génie informatique / logiciel",
      period: "2014 – 2016",
      location: "Belfort, France",
    },
    {
      school: "IUT de Toulouse",
      degree: "DUT Informatique",
      period: "2012 – 2014",
      location: "Toulouse, France",
    },
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect – Professional", issuer: "Amazon Web Services", date: "août 2023", url: "https://www.credly.com/badges/78b0a1d5-fd0e-4bb4-a111-e94977cc4649/public_url" },
    { name: "AWS Certified DevOps Engineer – Professional", issuer: "Amazon Web Services", date: "novembre 2023", url: "https://www.credly.com/badges/ec94c0fe-075f-4be2-a289-1fc42dfe2cf7/public_url" },
    { name: "AWS Certified CloudOps Engineer – Associate", issuer: "Amazon Web Services", date: "avril 2026", url: "https://www.credly.com/badges/c0552a82-3353-437f-816d-dd1200690026/public_url" },
    { name: "AWS Certified Data Engineer – Associate", issuer: "Amazon Web Services", date: "août 2024", url: "https://www.credly.com/badges/b2fe9b9a-7d30-47d5-ad06-d6a13d76ad59/public_url" },
    { name: "AWS Certified AI Practitioner (Early Adopter)", issuer: "Amazon Web Services", date: "août 2024", url: "https://www.credly.com/badges/d400ddf2-d889-4d55-87ce-7d1967cb2d63/public_url" },
    { name: "AWS Certified SysOps Administrator – Associate", issuer: "Amazon Web Services", date: "avril 2023", url: "https://www.credly.com/badges/c6d76950-27c5-4f66-8be2-4e1db8f044b3/public_url", expired: true },
    { name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", date: "mars 2023", url: "https://www.credly.com/badges/285ae003-e487-4175-b1b2-f86e6e2386cc/public_url", expired: true },
    { name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "février 2023", url: "https://www.credly.com/badges/cbd4778c-044f-4b84-a1b8-9e3bebabcbec/public_url", expired: true },
    { name: "HashiCorp Certified: Terraform Associate (003)", issuer: "HashiCorp", date: "août 2023", url: "https://www.credly.com/badges/768429a5-a6fe-4ba6-b82b-91ff97e8dc14/public_url", expired: true },
    { name: "AWS Certified Cloud Practitioner (CLF-C01)", issuer: "Amazon Web Services", date: "décembre 2022", url: "https://www.credly.com/badges/6f52dbc7-f604-483a-9e48-510114d0955c/public_url", expired: true },
  ],
  languages: [
    { language: "Français", level: "Langue maternelle" },
    { language: "Anglais", level: "Courant" },
    { language: "Japonais", level: "Professionnel (travail quotidien en japonais depuis 2018)" },
  ],
};

// ============================================================================
// JAPANESE
// ============================================================================

const ja: ResumeData = {
  profile: {
    name: "Tony Duong",
    title: "ソフトウェアエンジニア ・ バックエンド / フルスタック",
    location: "フランス・トゥールーズ",
    email: "tony.duong.102@gmail.com",
    github: "https://github.com/tonystrawberry",
    githubLabel: "github.com/tonystrawberry",
    linkedin: "https://www.linkedin.com/in/tony-duong-tokyo/",
    linkedinLabel: "linkedin.com/in/tony-duong-tokyo",
    website: "https://shirimono.fun",
    websiteLabel: "shirimono.fun",
    blog: "https://shirimono.fun/ja",
    blogLabel: "shirimono.fun/ja",
    summary:
      '<span class="text-primary">好奇心旺盛</span>で<span class="text-primary">計画的</span>、<span class="text-primary">主体的</span>なフルスタックエンジニア。<span class="text-primary">バックエンドに強い専門性</span>を持ち、<span class="text-primary">約8年</span>にわたり Web アプリケーションを一気通貫で開発——<span class="text-primary">Ruby on Rails</span> のバックエンド、<span class="text-primary">React/Next.js</span> のフロントエンド、その下の <span class="text-primary">AWS</span> インフラまで。<span class="text-primary">英語・フランス語・日本語</span>で開発できます。',
  },
  experience: [
    {
      company: "Spacely",
      role: "シニアバックエンドエンジニア → Team Lead",
      period: "2025年頃 – 現在",
      location: "東京 → トゥールーズ（2026年6月よりパートタイムフリーランス）",
      context:
        "不動産・住宅向け B2B クラウド VR プラットフォームの5人バックエンドチーム — 写真や3Dデータを没入型360°パノラマコンテンツに変換し、1,000社以上が利用。",
      highlights: [
        '<span class="text-primary">入社約1年で Team Lead に昇進</span>。<span class="text-primary">5人のバックエンドチーム</span>で新メンバーのオンボーディング、ミーティング運営、チームの儀式を刷新 — 不要な定例を削減し、週次の知識共有「Product Dive」を活性化。',
        '<span class="text-primary">2025–2026 期の社内アワードで最多ノミネーション</span> — 組織全体で最も多くのノミネーションを提出した社員。',
        "1日<span class=\"text-primary\">10,000回以上</span>実行される CPU 集約型の360°→キューブマップ変換ジョブを、共有 Sidekiq ワーカーから <span class=\"text-primary\">AWS Lambda</span> へ移行し<span class=\"text-primary\">約4倍高速化</span>。保存フローを最適化し、1ジョブを<span class=\"text-primary\">約2分→約10秒</span>、50枚バッチを<span class=\"text-primary\">約12分→2分未満</span>に短縮。",
        "Honeybadger のエラーアラートを<span class=\"text-primary\">2週間</span>で<span class=\"text-primary\">約10,000件から300件未満</span>まで削減（集中的なデバッグとバグ修正）。",
        "カスタム <span class=\"text-primary\">Jira アプリ</span>を構築 — 複数の DONE ステータスとストーリーポイントフィールドを複数ワークスペースにまたいで集約し、標準 Jira では設定できなかったバーンダウン/ベロシティチャートを実現。",
        "<span class=\"text-primary\">脆弱性診断</span>プロジェクトを一気通貫で主導 — セキュリティベンダーの選定、スコープ策定、実行 — コードベース全体の俯瞰を得る最短ルートとしても活用。",
        "マルチDB構成で <span class=\"text-primary\">Rails 7.1 → 7.2</span> へアップグレード。壊れたクロスDBテストをすべて修復。",
        "本番データの<span class=\"text-primary\">不整合</span>（重複など）を検知し、データセット全体を分析したうえで修正スクリプトを適用。再発防止のためバリデーション・ビジネスルール・インデックスを整備。",
        "生成系コンテンツ除去/配置や AI コンテキストチャットなど複数の <span class=\"text-primary\">AI 機能</span>を CRUD API・添付ファイル処理・技術仕様まで一気通貫で担当。パノラマ補正パイプラインを <span class=\"text-primary\">Lambda（CPU）から ECS（GPU）</span> へ再設計。",
        "AWS 上のインフラ・システム設計を主導 — <span class=\"text-primary\">Step Functions、Lambda、API Gateway、ECS</span>、ALB/VPC ネットワーク。",
        "ソースコードから <span class=\"text-primary\">API 仕様を自動生成</span>し、別リポジトリで手動管理していた仕様を置き換え。チームドキュメントを <span class=\"text-primary\">Qiita から Notion</span> へ移行。",
        "<span class=\"text-primary\">Datadog</span> オブザーバビリティを全面刷新 — <span class=\"text-primary\">約120モニター</span>の命名統一・担当タグ・ランブック整備、SLO/SLI ダッシュボード再構築、<span class=\"text-primary\">50以上のアラート</span>正規化。",
        "チームのコーディングルールを策定（現在は <span class=\"text-primary\">AGENTS.md</span> に組み込み）し、開発ワークフローのほぼ全工程に AI を統合。スペック駆動開発で毎週安全に依存ライブラリを更新。",
        '<a href="https://www.tokyodev.com/companies/spacely/interviews/tony-duong" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">TokyoDev インタビュー</a>で Spacely を代表。社内テックブログに4記事執筆：<a href="https://tech.spacely.co.jp/entry/2026/06/10/163831" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">360°キューブマップ約4倍高速化（Sidekiq → Lambda）</a>、<a href="https://tech.spacely.co.jp/entry/2026/04/24/163036" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Rails の lost update</a>、<a href="https://tech.spacely.co.jp/entry/2025/07/04/141254" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Cursor で生産性向上</a>、<a href="https://tech.spacely.co.jp/entry/2025/10/28/101247" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Rails 7.1 → 7.2 アップグレード</a>。',
      ],
      stack: [
        "Ruby on Rails",
        "PostgreSQL",
        "AWS (Step Functions, Lambda, API Gateway, ECS, S3, CloudFront)",
        "Datadog",
        "Honeybadger",
        "BigQuery",
        "GitHub Actions",
      ],
    },
    {
      company: "Monstarlab",
      role: "シニアバックエンドエンジニア → Tech Lead（コンサル）",
      period: "2022年頃 – 2024年（約2.5年）",
      location: "東京（江の島からリモート）",
      context:
        "グローバルデジタルコンサル — 多様なスタック・領域のクライアント案件。シニアバックエンドエンジニア（Ruby）として参画、約1年で Tech Lead に昇進。",
      highlights: [
        "<span class=\"text-primary\">大手日本自動車メーカー</span>向けプロジェクトで、メンバー離脱後にバックエンドリードを引き継ぎ、<span class=\"text-primary\">約6か月</span>で納品。",
        "デプロイミスで本番データが上書きされた際、<span class=\"text-primary\">Aurora Point-in-Time Recovery</span> で復旧 — 二度と起きない運用規律を身につけた。",
        "<span class=\"text-primary\">ChatGPT ベースの RAG チャットボット</span>のプロトタイプを AI エンジニアと共同開発。<span class=\"text-primary\">Amazon Lex・Connect</span> を <span class=\"text-primary\">Terraform</span> で完全プロビジョニング。",
        "Monstarlab の認定支援プログラムを通じて <a href=\"#certifications\" class=\"text-primary hover:underline\">約7つの AWS 認定</a>を取得 — 理論的基盤がその後も繰り返し活きている。",
        "東京とベトナム拠点の <span class=\"text-primary\">8人バックエンドチーム</span>を率い、高い品質基準を持つクライアント向け from-scratch ビルドをタイトなスケジュールで納期通りリリース。",
        "<span class=\"text-primary\">スキーマファーストの3層アーキテクチャ</span> — フロントと Ruby on Rails gRPC バックエンドの間に GraphQL BFF、共有 proto スキーマから両側のコードを生成。",
        "<span class=\"text-primary\">Google Calendar</span> 連携の予約システムを構築 — 空き確認・スロット予約に加え、ロール、参加者のスマート割当、時間制約など複雑なアプリケーションルールを統合。",
        "<span class=\"text-primary\">Google BigQuery（OLAP）</span> で分析機能を構築 — 日次・週次・3か月ビュー。日次集計ジョブの結果を OLTP に戻して高速読み取りを実現。",
      ],
      stack: [
        "Ruby on Rails",
        "gRPC",
        "GraphQL",
        "Terraform",
        "AWS (Aurora, Lex, Connect, ECS, RDS)",
        "BigQuery",
        "Google Calendar API",
      ],
    },
    {
      company: "Overflow",
      role: "ソフトウェアエンジニア",
      period: "2020年頃 – 2022年（約2.5年）",
      location: "東京・恵比寿、日本",
      context:
        "エンジニア・デザイナー向けの転職マッチングプラットフォーム「Offers」を開発するスタートアップの最初の正社員エンジニア。",
      highlights: [
        "<span class=\"text-primary\">Offers</span>（エンジニア・デザイナー向けの転職マッチングプラットフォーム）の開発に参加。プロダクトマネージャーやデザイナーと日々連携し、アイデアからリリースまで機能を形にした。",
        "条件に合う求人が出た際に、リクルーターと求職者へリアルタイムで通知する <span class=\"text-primary\">Slack 連携</span>を構築。",
        "<span class=\"text-primary\">Offers Magazine</span>（エンジニアリングとデザインのデジタルマガジン）を担当。デザイナーから受け取るデザイン（多くは HTML/CSS）をもとにフロントエンドを <span class=\"text-primary\">Vue.js</span> で開発し実データと接続。<span class=\"text-primary\">AWS CloudFront・WAF・S3</span> や WordPress をバックエンドとするヘッドレス CMS も実地で習得。",
        "<span class=\"text-primary\">AWS Redshift</span> を用いた高性能な分析ツールを構築し、複雑な SQL クエリで分析データを集計・抽出。",
        "当初はシニアエンジニアの指示に従っていたが、ほどなく自ら解決策を提案し新機能を設計するエンジニアへと成長。",
        "日常業務を <span class=\"text-primary\">日本語</span>（口頭・文章の両方）で行い、明確な文章コミュニケーションを強みに。<span class=\"text-primary\">Datadog・New Relic</span> でオブザーバビリティに取り組む。",
        "<span class=\"text-primary\">入社1年目</span>で昇進し、社内で <span class=\"text-primary\">上位約5%</span> の評価を獲得。優れたメンターのもとで「速く作る」から「良いものを作る」へ成長。",
      ],
      stack: ["Ruby on Rails", "Vue.js", "GraphQL", "AWS (CloudFront, WAF, S3, Redshift)", "Datadog", "New Relic"],
    },
    {
      company: "Seido",
      role: "ソフトウェアエンジニア インターン → ソフトウェアエンジニア",
      period: "2018年 – 2020年頃",
      location: "東京、日本",
      context:
        "インターンとして入社し、のち正社員（フルタイム）として採用。7人規模の EC 企業（日本の武道用品）で唯一の開発者として、社内ツールをゼロから構築。",
      highlights: [
        "<span class=\"text-primary\">Shopify API</span> と <span class=\"text-primary\">DHL・日本郵便・FedEx</span> を連携する出荷システムと、各配送業者の API を1つのビューに正規化する荷物追跡ダッシュボードを構築。",
        "会計/売上・確定申告ツール、受注パイプライン向けの <span class=\"text-primary\">Google Apps Script</span> 自動化、サードパーティ UI を補正する Tampermonkey スクリプトを作成。",
        "<span class=\"text-primary\">Rails + PostgreSQL（Heroku）</span> で日々リリースする <span class=\"text-primary\">一人のエンジニアチーム</span>として開発し、自ら倉庫でそのツールを使用。CEO の Jordy から会社の生産性を実際に押し上げたと評価された。",
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
        "社内のビデオ通話 API を組み込んだ <span class=\"text-primary\">Unity 製 VR ゲーム</span>のプロトタイプを構築し、通信プラットフォームと並ぶクライアント向けデモとして納品。",
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
      name: "Axie Infinity 遺伝子オーバーレイ（以前）",
      description:
        "各 Axie の遺伝子情報を API から取得し、サイトが表示していなかったマーケットプレイスの一覧に重ねて表示する Chrome / Firefox ブラウザ拡張機能。ゲームの Discord で共有し、1日あたり数百ダウンロード、ピーク時には Stripe の買い切り解除で1日約30ドルを記録。",
      stack: ["JavaScript", "Chrome 拡張", "Firefox 拡張", "Stripe"],
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
    { label: "プラクティス", items: ["CI/CD (GitHub Actions)", "TDD / RSpec", "コードレビュー", "i18n"] },
  ],
  education: [
    {
      school: "UTBM（フランス）・ ÉTS モントリオール（カナダ）",
      degree: "ダブルディグリー（工学）— コンピュータ / ソフトウェア工学（修士相当）",
      period: "2016年 – 2018年",
      location: "ベルフォール（仏）・ モントリオール（加）",
    },
    {
      school: "UTBM（ベルフォール＝モンベリアール工科大学）",
      degree: "工学 — コンピュータ / ソフトウェア工学",
      period: "2014年 – 2016年",
      location: "ベルフォール（仏）",
    },
    {
      school: "IUT de Toulouse（トゥールーズ大学工学部）",
      degree: "DUT Informatique（2年制専門学士）",
      period: "2012年 – 2014年",
      location: "トゥールーズ（仏）",
    },
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect – Professional", issuer: "Amazon Web Services", date: "2023年8月", url: "https://www.credly.com/badges/78b0a1d5-fd0e-4bb4-a111-e94977cc4649/public_url" },
    { name: "AWS Certified DevOps Engineer – Professional", issuer: "Amazon Web Services", date: "2023年11月", url: "https://www.credly.com/badges/ec94c0fe-075f-4be2-a289-1fc42dfe2cf7/public_url" },
    { name: "AWS Certified CloudOps Engineer – Associate", issuer: "Amazon Web Services", date: "2026年4月", url: "https://www.credly.com/badges/c0552a82-3353-437f-816d-dd1200690026/public_url" },
    { name: "AWS Certified Data Engineer – Associate", issuer: "Amazon Web Services", date: "2024年8月", url: "https://www.credly.com/badges/b2fe9b9a-7d30-47d5-ad06-d6a13d76ad59/public_url" },
    { name: "AWS Certified AI Practitioner (Early Adopter)", issuer: "Amazon Web Services", date: "2024年8月", url: "https://www.credly.com/badges/d400ddf2-d889-4d55-87ce-7d1967cb2d63/public_url" },
    { name: "AWS Certified SysOps Administrator – Associate", issuer: "Amazon Web Services", date: "2023年4月", url: "https://www.credly.com/badges/c6d76950-27c5-4f66-8be2-4e1db8f044b3/public_url", expired: true },
    { name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", date: "2023年3月", url: "https://www.credly.com/badges/285ae003-e487-4175-b1b2-f86e6e2386cc/public_url", expired: true },
    { name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2023年2月", url: "https://www.credly.com/badges/cbd4778c-044f-4b84-a1b8-9e3bebabcbec/public_url", expired: true },
    { name: "HashiCorp Certified: Terraform Associate (003)", issuer: "HashiCorp", date: "2023年8月", url: "https://www.credly.com/badges/768429a5-a6fe-4ba6-b82b-91ff97e8dc14/public_url", expired: true },
    { name: "AWS Certified Cloud Practitioner (CLF-C01)", issuer: "Amazon Web Services", date: "2022年12月", url: "https://www.credly.com/badges/6f52dbc7-f604-483a-9e48-510114d0955c/public_url", expired: true },
  ],
  languages: [
    { language: "フランス語", level: "母語" },
    { language: "英語", level: "流暢" },
    { language: "日本語", level: "ビジネスレベル（2018年から日常的に業務で使用）" },
  ],
};

export const resumeData: Record<Locale, ResumeData> = { en, fr, ja };
