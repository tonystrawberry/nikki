---
title: "Chapter 3: Learning to Build Well"
date: "2026-05-27"
excerpt: "Two and a half years at Overflow — a Tokyo startup, a Slack cron job, a mentor named Ohtani-san, the AWS vocabulary I never had, a couple of Stripe side projects, and the restlessness that eventually walked me into Monstarlab."
author: "Tony Duong"
category: "note"
tags: ["career-story", "career", "personal", "japan", "tokyo", "overflow", "aws"]
coverImage: ""
collection: "career-story"
collectionOrder: 3
collectionTitle: "Story of My Career"
---

When I started looking for the next job, I did what most developers in Tokyo do: I opened LinkedIn.

I also took a swing at Google. I got stuck on the algorithm problem. I'd never done Leetcode — never really thought about it — and that interview was the moment I learned what "you need to grind for this" actually means. Rejected. Fair. I'd tried.

Then I went to Bizreach, which is a big recruiting firm in Japan but also recruits engineers internally. The whole interview was in Japanese, and I genuinely thought I'd done well. Got rejected anyway. No big deal. The job search at this stage felt more like calibration than failure — I was finding out where the bar was.

The breakthrough came sideways. A French recruiter based in Tokyo messaged me on LinkedIn, and through him I ended up interviewing at a startup called Overflow, based in Ebisu. Their product was a job-matching platform for engineers and designers. The interview itself was rough. My Japanese held up some of the time and gave way the rest. There were questions I didn't have answers to. I don't even remember what they were anymore — only that I walked out with no real expectation of hearing back.

A few days later, an acceptance email landed in my inbox. I had to read it twice. *Wait — I'm going to work in a Japanese company, speaking Japanese, every day?* The nervousness and the excitement showed up at the same time, fighting each other in my chest.

The interviewer who'd hired me was Ohtani-san — and Ohtani-san turned out to be one of the best and kindest mentors I have ever had. You could feel it from the first weeks at work. He genuinely wanted me to grow as an engineer, and he was patient enough to actually invest in that.

Fun fact: I was the first full-time employee at Overflow. Until then, everyone had been freelance or part-time. So this was a "ground floor" kind of role, and a real culture shift from Seido — where I'd been a one-person engineering machine.

If I had to draw the difference between Seido and Overflow in a single sentence: at Seido I learned how to *build*, and at Overflow I learned how to build *well*.

The things I picked up at Overflow added up fast. AWS, properly — CloudFront for CDN, S3 for storage, the networking layer, containerization, security with WAF and Shield. Observability and monitoring with Datadog and New Relic. The whole vocabulary of "highly available, performant, scalable" went from abstract phrases I could repeat in interviews to ideas I could actually reason about. My very first task was a Slack integration that fired recommended candidate lists to recruiters on a cron — small in scope, but it landed, and I noticed something while shipping it: communication, at this kind of company, was as much a skill as the code. Being able to explain what you were doing and why, clearly, in writing — that was respected at the same level as the technical work. My spoken Japanese still wasn't great, but I leaned hard into written communication. I love structure anyway, so that part of the job fit me.

The features kept coming. A blog product called Offers Magazine. An analytics feature in the main Offers app to show funnel numbers per stage, which is where I learned BigQuery and what big-data aggregation actually feels like at scale. GraphQL APIs. Hours and hours of debugging. Dozens of features over the next two-plus years — too many to remember individually now. There were urgent hotfix deploys and last-minute bug-hunts in there too. I don't remember the specifics anymore, which is probably the best thing I can say about them. I never destroyed the database. I'll take it.

One piece of feedback from Ohtani-san landed early and stuck with me. I was shipping fast. Probably too fast. He pulled me aside in my first month and told me to slow down — to focus more on quality before velocity. I took the advice, and I'm still glad he gave it to me.

Outside of work, two big things happened during this stretch. I met the love of my life — she's Japanese — and although my Japanese was definitely improving in our daily life together, I have to be honest: my Japanese got *much* better at work. The work-Japanese muscle is its own thing. Somewhere in this stretch I noticed I'd started dreaming in Japanese, which is the kind of thing you can't fake. I was understanding more and more without reaching for a translation tool.

I also got into a couple of side projects.

The first was a Chrome extension for Axie Infinity — that NFT game where you breed and trade monsters with cryptocurrency. I was a player myself, and I'd put some money into it, so I knew the marketplace UI pretty well. One day I noticed something specific: the API exposed each Axie's *genes*, but the website didn't show them on the listings. Those genes mattered to anyone making serious breeding decisions. So I wrote a userscript / Tampermonkey-style extension that pulled the genes from the API and overlaid them on the marketplace cards. I dropped a link in the Axie Discord — there were thousands of people in there — and started seeing hundreds of downloads a day. I added a one-time unlock fee through Stripe. People paid. At the peak I was bringing in around \$30 a day from it. Not life-changing money, but real money showing up while I slept, which was a new experience.

The second was a Japanese-learning site called Shirimono — same approach, Stripe subscriptions, the whole thing. It topped out at about three paying users, and I didn't have the bandwidth to keep building it, so I shut it down. (Footnote from May 2026: I picked Shirimono back up earlier this year, rebuilt it from scratch. So that one isn't actually closed — it just took a long pause.)

Both side projects together never made me rich, but the experience of building, deploying, monetizing, and supporting them was worth more than the money. The kind of full-stack ownership those projects forced was its own course.

About a year in at Overflow, I got a big promotion. Ohtani-san told me I was somewhere around the top 5% of performers in the company. The exact number might be slightly off in my memory, but the moment isn't — I was shocked, and I felt genuinely appreciated. That's the kind of feeling I want to remember well, because it's not the kind of thing you control.

And then, about two and a half years in, the restlessness started again.

It wasn't a problem with the company or the people. It was that I was developing in the same platform every day, and I could feel a ceiling on how much new ground I was breaking. I wanted *more* again. A thought formed: what if I went to a consulting firm — somewhere I'd get assigned to different clients, different stacks, different problems, on rotation?

Telling Ohtani-san I was leaving was one of the hardest conversations of my career so far. And it wasn't *one* conversation — it was many. We had 1:1 after 1:1 about it, and every single time I walked out of his office asking myself *is this actually the right call?* He's someone I respect enormously, and I could feel him trying — gently, never pushy — to keep me on. The whole process dragged out over months because honestly I didn't want it to be over either.

Even after I formally resigned, Ohtani-san stayed in my corner. He kept making himself available for career advice — still does, years later — and he hired me back as a freelancer to help on some new app features. The extra income was nice. But working 2–3 hours after my main job, every night, drained me completely. I tapped out after about half a month.

I went back to the same recruiter who'd introduced me to Overflow in the first place and asked if he knew any consulting firms that did external client work. He introduced me to Monstarlab — a global consulting firm with offices in a lot of countries, and a big presence in Japan. The interview was the smoothest I'd ever done, and I could feel the difference. Two and a half years of Overflow was sitting right there in my answers — we talked deeply about backend performance, AWS, caching, strategies for keeping a database highly available under load. I knew this stuff now. Comfortable, for once. Confident.

I got the offer. I accepted.

Next destination: Monstarlab.
