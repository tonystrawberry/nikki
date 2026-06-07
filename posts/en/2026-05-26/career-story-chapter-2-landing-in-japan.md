---
title: "Chapter 2: Landing in Japan"
date: "2026-05-26"
excerpt: "Tokyo, February 2018. A sharehouse in Kami-Itabashi, a seven-person company called Seido, and a blank-sheet stretch of building everything from scratch — until the doubt set in."
author: "Tony Duong"
category: "note"
tags: ["career-story", "career", "personal", "japan", "tokyo", "seido"]
coverImage: ""
collection: "career-story"
collectionOrder: 2
collectionTitle: "Story of My Career"
---

I landed in Tokyo in February 2018 and went straight to a sharehouse in Kami-Itabashi. Around thirty people lived there, mostly Japanese in their twenties and thirties — basically a perfect environment for someone arriving alone in a country they'd been studying from afar. Friends and language practice, built in.

The first 48 hours were the version of Japan you imagine *before* you've been. Everything new, everything overstimulating. I sat on the train and realized I could read the kanji on the station signs. Years of WaniKani, quietly accumulating, suddenly cashing out into something useful. My speaking was garbage, but I could *read*. I felt like I'd found a cheat code.

The company was Seido — seven people, selling Japanese martial arts gear online. I'd been hired almost at the same time as another software dev, my senpai, but we worked on completely different things. He maintained the Shopify storefront: widgets, checkout, item display. Jordy threw me at a brand-new internal-tools project, completely from scratch.

What I built over the next stretch is the part I look back on most fondly, because I built it as a blank sheet. No mentor, no code reviewer, no AI. Just docs, time, and a stubborn refusal to stay stuck.

There was a shipment system that talked to the Shopify API and stitched together DHL, Japan Post, and FedEx. A parcel-tracking dashboard that pulled from each carrier's API and normalized them into a single common view. Tampermonkey scripts to patch the bits of third-party UIs that nobody was going to fix for us. Ruby on Rails on the server with PostgreSQL, deployed to Heroku. Google Apps Script to automate the spreadsheets the team was using for the order pipeline. An accounting tool that crunched monthly revenue and the tax declaration. There was more — eight years is a long time and the specifics blur — but the shape of it was: every problem the team had, I'd go build a tool for it. Then I'd use the tools myself. I'd be at the warehouse wrapping parcels, printing labels through software I'd shipped the day before, while the postman came by to pick up the 20–30 packages going out that day. Both sides of the keyboard.

I was busy every single day and I didn't burn out. I loved it. Everything was new — the codebase, the language outside work, the city, the food. A blank sheet on every axis at once, and somehow that was the most energizing part.

Jordy told me at the end of the internship that the internal tooling had genuinely moved the company's productivity forward, and offered me a full-time role. Yes, obviously yes. But I had to fly back to France first for my final oral presentation. Because of the timing — and frankly, because I couldn't afford the trips — I ended up missing both graduation parties, the one in Montreal and the one in Belfort. That stung a little. Still does, when I think about it. But Tokyo was waiting.

Half of what made Seido great wasn't the work — it was the people. Most of the team was French, which made the transition into Japan unreasonably smooth. I could code-switch into French during a frustrating debug, walk out for lunch and try (badly) to order in Japanese, come back and talk architecture in French again. The colleagues felt like big brothers: Jeff, Antoine, Nico, Alex, Jason. Some of them are still close friends today.

Jordy himself had a hot temperament. He got angry at me sometimes — usually fairly, for actual mistakes. The classic version was a busy shipment day, a bug somewhere in my system, and parcels piling up that should already have been on a truck. Before my tools, the team had done everything manually — but the worst part of having automated it was that going back to manual was no longer an option. So when the system broke, the pressure landed on me. I'd be debugging under a clock, Jordy stressed, the whole flow waiting. Every single time, it ended well. But the stress was real. I don't hold it against him. What I took away from working under him, more than anything technical, was how to hold my ground: how to listen to a boss who's frustrated, take the part that's true, and still defend my position when I thought I was right. I still have a great relationship with him. He lives in Okinawa now — I went down to see him recently. Okinawa is my favorite prefecture in Japan, by far.

Outside of work, Japan turned out to be more fun than I'd imagined — which is saying something, given how much I'd imagined. I joined a hip-hop circle. I spent days just walking Tokyo neighborhoods with no plan. 100,000 yen a month meant a lot of pasta and tomato sauce — but pasta and tomato sauce happens to be one of my favorite meals, so it never really felt like sacrifice. (Eight years later, that hasn't changed either.) And then on top of that, the actual Japanese food: tonkatsu, kaiten sushi, ramen. *Miam.*

The other thing I'm glad I did with my Montreal savings was fly the family out — parents, sisters, the whole crew. I wanted them to see this place I'd just thrown my life at. They loved it so much they've come back almost every year since.

And then, eventually, the doubt started.

The strange thing is that it didn't come from failure. I was rarely stuck. When I was, I'd grind through — I remember one stretch where I lost a few days to a React rendering bug, the state was right but the UI just wouldn't catch up to it. Those days happened. But I always found my way out. The solution wasn't always the best one, but it worked, and I kept moving.

The doubt was quieter than that. I'd built a lot at Seido — really a lot — but I'd built it alone. No code reviews. No one to tell me I was about to ship an N+1 query that would haunt the next person who opened the file. (There are probably a few of those still in there, honestly.) I was deploying every five minutes and it was working, but I had no idea whether what I was doing was *good*. I just knew it ran.

I wanted a mentor. I wanted code reviews. I wanted to work in Japanese, not in French. I wanted to know what good engineering looked like, not just what shippable engineering looked like.

So it was time to go. And I want to be clear about this part: Seido was a blessing. In a lot of ways, those first years were the best years of my life in Japan. But the growth I needed next was somewhere else, and I had to go find it.

---

## Achievements

A more concrete record of what I built at Seido, as the sole developer:

- **Built the company's internal tooling from scratch** — no mentor, no code reviews — on Ruby on Rails and PostgreSQL, deployed to Heroku, shipping every day.
- **Shipped a shipment system** integrating the Shopify API with DHL, Japan Post, and FedEx, plus a parcel-tracking dashboard that normalized each carrier's API into a single common view.
- **Automated the order pipeline** with Google Apps Script and wrote an accounting tool that computed monthly revenue and the tax declaration.
- **Patched the third-party UIs the team depended on** with Tampermonkey userscripts, fixing the gaps nobody else was going to fix.
- **Used the tools myself in the warehouse** — wrapping and labelling the 20–30 parcels going out each day — which Jordy (CEO) credited with measurably moving the company's productivity forward, leading to a full-time offer.
