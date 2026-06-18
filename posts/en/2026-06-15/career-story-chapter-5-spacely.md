---
title: "Chapter 5: Spacely"
date: "2026-06-15"
excerpt: "A bicycle from Tokyo to Osaka, snow I didn't plan for, and then Spacely — a Japanese VR platform, a four-person backend team, a Rails upgrade that taught me the whole codebase, a core job made 4× faster, Honeybadger alerts cut from 10k to under 300, and becoming Tech Lead. A year and a half that felt like four. And then France."
author: "Tony Duong"
category: "note"
categories: ["work", "reflections"]
tags: ["career-story", "career", "personal", "japan", "tokyo", "spacely", "rails", "aws", "leadership", "freelance"]
coverImage: ""
collection: "career-story"
collectionOrder: 5
collectionTitle: "Story of My Career"
---

My last day at Monstarlab was around the 15th of December, just before Christmas and New Year. I didn't rush into the next thing. I used the gap.

First, time with my wife and my parents-in-law in her hometown, Karatsu. I love that city — a coastal town, peaceful and calm, and it has a castle. The kind of place that slows your pulse down a notch the moment you arrive.

Then I did something I'd wanted to do for a while: a bicycle trip from Tokyo to Osaka. Alone. A hell of a trip. I even rode through snow for part of the route — completely unplanned. Japan is *mountainous*, and some of the slopes were brutal, but for some reason I found the energy somewhere to climb every one of them without stopping. I still don't entirely know how I did it. Wonderful memories.

And then I came back to Tokyo, and I was ready for Spacely.

## Landing on the backend team

I joined as a senior backend engineer. The backend team was four engineers, and from day one everyone was warm and genuinely supportive. They told me they'd been impressed by my coding assignment — and I'll admit it, I really did put my best into that one.

A few sentences on what Spacely actually is: it's a Japanese B2B cloud VR platform, trusted by over a thousand companies in the real estate and housing industries. It lets businesses turn photos or 3D data into immersive 360° panoramic VR content in as little as thirty minutes — which helps them drive customer inquiries, showroom visits, and conversions. My job was the backend of the whole platform: keeping everything running smoothly and shipping new features fast.

Here's the thing I felt almost immediately at Spacely — the fruit of my six previous engineering years. For the first time, I wasn't reaching. The range of work I got pulled into was wide, and most of it landed somewhere I already had ground under my feet.

## A wide year and a half

I won't pretend this was a single tidy storyline. It was a lot of different kinds of work, often at once, and that variety is exactly what I loved about it.

I built features in close, regular conversation with the PMs. I worked on the backend development workflow itself in a dozen small ways — establishing coding rules, for instance, which now live inside our `AGENTS.md` files for the AI tools to follow. I proposed migrating our documentation from Qiita to Notion, which turned out to be a much better home for organizing the whole tech knowledge base.

A lot of my energy went into the unglamorous, compounding stuff: refactoring, improving code quality, making things readable, introducing tools that make the day-to-day better for everyone. Over a year and a half, together with my colleagues, we wove AI into nearly every part of the workflow — from writing code to maintaining it. One thing I'm quietly proud of: I took a core job that the platform runs more than 10,000 times a day and made it roughly **4× faster**. I wrote that one up in detail, if you're curious — [making 360° cubemap generation ~4× faster](/en/posts/off-the-worker-into-lambda-360-cubemap-generation-4x-faster).

I also led a **vulnerability assessment** project — talking to potential security firms, scoping the engagement, running it. I volunteered for that one on purpose, because I figured it was the fastest way to get a bird's-eye view of the whole codebase. I like having that view: knowing how the components actually fit together, not just the corner I happen to be working in.

The **Rails upgrade from 7.1 to 7.2** scratched the same itch, the hard way. We run a multi-database setup, and the upgrade broke a lot of unit tests that spanned more than one database. It took me a long time — but a task like that touches every part of the codebase, so by the end of it I knew the whole thing far better than before. Worth it.

A good chunk of my time went into infrastructure and system design, where my AWS experience — and everything I'd absorbed studying for the certifications — paid off again and again. Services I touch most days: Step Functions, Lambda, API Gateway, ECS, and the networking layer with ALB and VPC. I also automated our **API specification generation** so it's produced straight from the source code. It used to be maintained by hand in a separate repo — double the work, and hard to keep honest. Generating it from source makes it reliable by construction.

And I got *very* close to **Datadog** — logs, traces, metrics. I rebuilt dashboards and normalized over fifty alerts: their naming, their messages, their runbooks. Unsexy work that quietly makes every future incident less painful.

On the debugging front — and I genuinely love debugging — I brought our **Honeybadger alerts down from around 10,000 to under 300** in a two-week window. That one was satisfying in a way that's hard to explain to non-engineers.

I also built a **Jira app** that finally gave us honest burndown and velocity charts. Default Jira couldn't do what we needed — we have many statuses that should count as DONE but don't in the out-of-the-box reports, and sprint points live in different custom fields across several Jira workspaces. Without aggregating all of that correctly, we had no precise way to see how fast the development team was actually moving.

## Becoming a Tech Lead

In December 2025, ten months after joining, I became **Tech Lead**. I wasn't expecting how much I'd enjoy it.

Some of it was the obvious stuff — onboarding new members, leading meetings. But I also went after the meetings themselves: I cut every unnecessary recurring one I could, and I took the initiative to make our weekly **"Product Dive"** more alive. It's a meeting where any engineer can introduce what they've been working on, however small. The point is to raise everyone's awareness of each other's work and to share knowledge — because we tend, as engineers, to disappear into our own bubbles. Even a small new button deserves to be known by the team. We still have the daily standup where we say what we're doing, but you don't really *understand* a piece of work until someone explains it to you clearly.

I also wrote **four articles** for the company tech blog. And — because I can't help myself — I prototyped a whole new design for the blog, since I think the current one feels very 2000s. [Here's the proposal.](https://spacely-blog-nuxt.vercel.app/en) I think it's much nicer and actually makes you want to read and learn about the company. My colleagues weren't thrilled about it, so I let it go. No regrets — it was good practice, and that's worth something on its own.

Somewhere in there, Spacely also asked me to represent the company in an interview with **TokyoDev**, one of the most popular engineering job platforms in Japan. [Here's the interview](https://www.tokyodev.com/companies/spacely/interviews/tony-duong), if you're interested.

And on the side, I built **Shirimono** — a Japanese-learning app — and shipped both the web version and a mobile app (it's [on the App Store](https://apps.apple.com/jp/app/shirimono/id6759329826)). It was a lot of fun to build, and it's free, so if you're learning Japanese, give it a try.

That's… a lot. I know. Everything is still so fresh that it spills out. A year and a half at Spacely felt like three or four — we did so much, and I had fun doing it, and most of that comes down to my teammates. Open to new ideas, endlessly supportive, and an EM who gave me a remarkable amount of freedom.

## The turn — back to France

Now it's June, and my wife and I have decided to go back to France. I missed it. I missed my family. The restlessness I've learned to trust pointed home this time, not to another company.

So I resigned from Spacely as a full-time employee — and they offered me the chance to keep working with them from France, as a freelancer. I'm genuinely grateful for that.

Spacely is a company where the individual is really valued, and you can feel it. So many of my colleagues took paternity or maternity leave for months at a time, and people covered for each other without resentment, supportive in exactly the moments that count. That's not a small thing, and it's not common. I'd recommend the company to anyone.

A new chapter starts in France. But that's a page I haven't written yet.

---

## Achievements

A more concrete record of what I did across my time at Spacely:

- **Joined a four-person backend team as a Senior Backend Engineer** (Ruby on Rails), responsible for the backend of the whole VR platform, and was **promoted to Tech Lead** ten months in (December 2025).
- **Made a core production job ~4× faster** — a CPU-heavy 360°-to-cubemap conversion run more than 10,000 times a day — by moving it off the shared Sidekiq workers and onto AWS Lambda. ([Full write-up.](/en/posts/off-the-worker-into-lambda-360-cubemap-generation-4x-faster))
- **Cut Honeybadger error alerts from ~10,000 to under 300** in a two-week window through focused bug-fixing.
- **Built a custom Jira app** for burndown and velocity charts — aggregating multiple DONE statuses and sprint-point fields across several Jira workspaces, which default Jira couldn't configure.
- **Led a vulnerability assessment project** end to end — evaluating security firms, scoping, and running the engagement — partly as the fastest route to a bird's-eye view of the codebase.
- **Upgraded Rails from 7.1 to 7.2** across a multi-database setup, repairing the many cross-database tests it broke along the way.
- **Led infrastructure and system-design work** on AWS — Step Functions, Lambda, API Gateway, ECS, and the ALB/VPC networking layer — backed by hands-on experience and several AWS certifications.
- **Automated API specification generation** directly from source code, replacing a hand-maintained spec in a separate repo with one that's reliable by construction.
- **Established team coding rules** (now embedded in `AGENTS.md` files) and helped weave AI into nearly every stage of the development workflow, from writing code to maintaining it.
- **Migrated team documentation from Qiita to Notion**, giving the tech knowledge base a better-organized home.
- **Overhauled Datadog observability** — rebuilding dashboards and normalizing 50+ alerts' naming, messages, and runbooks.
- **Reshaped the team's meetings as Tech Lead** — cutting unnecessary recurring meetings and revitalizing the weekly "Product Dive" knowledge-sharing session.
- **Wrote four articles** for the company tech blog, and prototyped a full redesign of the blog as a proposal.
- **Represented Spacely in a [TokyoDev interview](https://www.tokyodev.com/companies/spacely/interviews/tony-duong)**, one of Japan's leading engineering job platforms.
