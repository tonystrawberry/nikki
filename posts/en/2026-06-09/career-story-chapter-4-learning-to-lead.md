---
title: "Chapter 4: Learning to Lead"
date: "2026-06-09"
excerpt: "Monstarlab — a global consulting firm, a remote desk in Enoshima, a different client every time. A Christmas spent recovering production data, a pile of AWS certifications, a chatbot built in Terraform, a promotion to Tech Lead, and eight engineers in Da Nang who taught me what leading actually costs."
author: "Tony Duong"
category: "note"
categories: ["work", "reflections"]
tags: ["career-story", "career", "personal", "japan", "tokyo", "monstarlab", "aws", "leadership"]
coverImage: ""
collection: "career-story"
collectionOrder: 4
collectionTitle: "Story of My Career"
---

I've already written about how hard it was to leave Overflow. What I didn't say is who I was leaving behind. Keita, Matsun, Fujikawa-san, Tabito-san — thank you. For the years, and for trusting me in the first place, back when I was convinced I'd fumbled the interview with my immature level and my broken Japanese. It took three one-on-ones with Tabito-san before I could actually make up my mind to go, and when I finally told the team, I felt genuinely sad. Two years on the same project will do that. You don't notice the roots until you try to pull them up.

The job search itself was short. Two interviews. One was a fintech startup, and I completely messed it up — the role was full-stack with a frontend lean, and even after two years of Vue.js at Overflow, my frontend knowledge was thinner than I wanted it to be. No problem. You find out fast where your edges are.

The other was Monstarlab.

A big consulting firm with offices scattered all over the world, and the role was Senior Backend — much more my thing. The interview was the kind of conversation I'd been quietly hoping to have for a while. The interviewer was the EM at the time, and we ended up deep in system design: CDN, caching, read replicas, load-balancing strategies. We talked through the coding assignment I'd submitted, a small Rails application. For once I wasn't reaching for vocabulary I'd half-memorized — I'd actually lived this stuff for two and a half years at Overflow, and I could feel it. I got the offer, with a big jump in salary on top of it.

If Seido is where I learned to *build*, and Overflow is where I learned to build *well*, then Monstarlab is where I learned to build *with other people* — and, eventually, to lead them.

## A different kind of company

Monstarlab takes projects from clients, which means the engineers get assigned out to different projects. So even though I belonged to the backend team, we often weren't actually working *together*. That was the one thing that genuinely bugged me. There were so many colleagues — friends, really — I wanted to build something with and never got the chance to, because we were always on opposite ends of different client work. That's just how consulting goes. You make peace with it.

Almost everything else, I loved. The role was remote, and I leaned into that fully. I was living in Enoshima by then — beautiful, but a long way from the Tokyo office, so I'd go in maybe two or three times a month. Always a good day when I did. (I even gave a little presentation about France at a company wine party once. Ask me about the wine, not the public speaking.)

And here's something I didn't expect to matter as much as it did: roughly half the engineers were foreigners. At Overflow I'd been the only one — the lone non-Japanese guy figuring out work-Japanese in real time. At Monstarlab I wasn't the exception anymore, and that took a quiet kind of pressure off that I hadn't even realized I'd been carrying.

## The first project, and a Christmas I won't forget

My first project was for a big Japanese automobile company — a name everyone knows. I joined midway, so the foundations were already laid. Backend engineer, Ruby on the server, which meant I was comfortable from day one and could dive straight in. Honestly it wasn't a hard project. Which is exactly why I decided I was going to do it *really* well.

Three months in, a few members rolled off, and I found myself the backend lead. The project wrapped about six months later without much drama.

Well — one piece of drama. I worked on Christmas that year. A miscommunication on my end led me to run a task that overwrote some production data. The good kind of mistake, in the end, because the way out of it was learning Aurora's Point-in-Time Recovery inside and out, under exactly the kind of pressure that makes a lesson stick. I've never looked at a production task the same way since. *Joyeux Noël.*

After that the project settled into maintenance and cleanup and handing things over — quiet. So I used the quiet.

## Going deep on AWS

I'd touched AWS plenty at Overflow, but almost all of it was web-shaped: EC2, ECS, RDS, S3, SQS, the networking layer with ALB and VPC, CloudFront, WAF, Redshift. I knew enough to be useful. I wanted to know enough to be dangerous. AWS is a platform I genuinely enjoy working with, and I wanted to go deeper into the infrastructure side of it, not just the application side.

So I more or less harassed the EM until they put me on an AWS infra project. Thank you Serigne — one of the nicest people I've ever worked with — for making it happen.

The next project was for one of those Japanese conglomerates that's in *everything* — banking, e-commerce, telecoms, you name it. I worked alongside the AI engineer to build a chatbot powered by ChatGPT with RAG — not unlike the little chat assistant I later built for this very blog. That's where I got my hands on Amazon Lex and Amazon Connect and a handful of other services I've since half-forgotten, all of it provisioned with Terraform. It took a few weeks to stand up the prototype, entirely in Terraform, and I loved that stretch of work — there's something deeply satisfying about describing a whole system in code and watching it materialize. The catch: it was only ever a prototype. But the learning was real.

Monstarlab also offered financial support for AWS certifications, so I went all in and studied hard. I came away with around seven of them. People are sometimes a little dismissive of certs, and I get it — but that theoretical grounding has paid off again and again since, in ways I didn't anticipate at the time. A lot of things just *click* now that used to be fog.

About a year in, I got a big jump: promoted to **Tech Lead**. The feedback was something about my contribution and my proactive, positive attitude on projects — I don't remember the exact words, but I remember how it felt. Appreciated.

## The hardest one

The third project was the longest and the hardest of my time there. Backend lead on an important build for another major company, from scratch, with a tight schedule and a *lot* to deliver. Looking back, it was genuinely a lot for the time we had.

I was managing eight backend engineers, all of them from our Vietnam branch office. There was a backend lead on their side too, who was a huge help (a wink to you, Tien). A lot of the team were juniors, but you could feel the *want* in them — the will to learn, to do things properly. And I've always liked having my hands dirty, especially back then, when you still wrote code by hand. So on top of the tech-lead work, I ended up in the code alongside them.

That's where I really had to learn to balance quality against time — not as a slogan, but as a daily decision with a tight deadline pushing on it. At one point the PMs floated adding more backend developers to speed things up. I pushed back. We already had eight people plus me, and my gut said more hands would slow us down, not speed us up. (I didn't have the name for it then, but I'd reinvented Brooks's Law from the inside.)

Every single day was full. *Dense* is the word — compact, packed, no slack in it. What made it bearable was the people. They were so warm that the pressure never curdled into misery. We even flew out to Vietnam for a business trip, where I got to practice my Vietnamese a little, eat extraordinarily well — Vietnamese hospitality is something else, they will not let you go hungry — play some football, and squeeze in a morning run along the beach in Da Nang. You build a different kind of team spirit when you've run on the same sand.

The client was strict and held a very high bar, and as stressful as that got, it's exactly what made me better — not just technically, but on the soft-skill, managing-people side I'd never really had to flex before. And we made the release. The last week was brutal — I remember going into the client's office in person to polish the final build, a few late nights stacked back to back — but we shipped it. Good job, everyone. I mean that.

## The turn, again

Two and a half years went by, and the same old feeling came back: I hadn't found my status quo yet. It's not that anything was wrong. I have nothing but fond memories of Monstarlab — the projects, the dinners, the colleagues, several of whom I still see regularly outside of work. But the restlessness is honest, and I've learned to trust it.

So I made the move to where I am now: **Spacely**. Found it on LinkedIn, applied, got in.

But that's a new page — and I'll tell you about it in the next chapter.

---

## Achievements

A more concrete record of what I did across my time at Monstarlab:

- **Joined as a Senior Backend Engineer** (Ruby) with a significant step up in scope and salary, and was **promoted to Tech Lead** about a year in.
- **Stepped up as backend lead** on a project for a major Japanese automobile company when teammates rolled off, and saw it through to delivery over roughly six months.
- **Recovered overwritten production data using Aurora Point-in-Time Recovery** after a deployment mistake — and learned the discipline that makes sure it never happens twice.
- **Built a ChatGPT-powered RAG chatbot prototype** for a major Japanese conglomerate, working alongside an AI engineer with Amazon Lex and Amazon Connect, fully provisioned in Terraform.
- **Earned around seven AWS certifications** through Monstarlab's certification support — theoretical grounding that's paid dividends ever since.
- **Led an eight-engineer backend team** across the Tokyo and Vietnam offices on a from-scratch build for a demanding, high-standards client, balancing quality against a tight schedule and shipping the release on time.
