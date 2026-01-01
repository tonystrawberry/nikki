import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "About Me | sekai",
  description: "Learn more about Tony Duong - developer, writer, and lifelong learner.",
};

const skills = [
  "TypeScript", "React", "Next.js", "Node.js", "Python",
  "PostgreSQL", "Tailwind CSS", "AWS", "Docker"
];

const interests = [
  { emoji: "📖", label: "Reading" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "🎵", label: "Music" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "🍜", label: "Food" },
  { emoji: "📷", label: "Photography" },
];

const timeline = [
  { year: "2024", event: "Started this blog to share my journey" },
  { year: "2023", event: "Dove deep into AI and machine learning" },
  { year: "2022", event: "Built my first SaaS product" },
  { year: "2020", event: "Transitioned to full-stack development" },
  { year: "2018", event: "Wrote my first line of code" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Hero Section with Avatar */}
      <section className="text-center mb-16 opacity-0 animate-fade-in-up">
        <div className="relative inline-block mb-6">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-1">
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center text-5xl">
              👋
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-card border-4 border-background flex items-center justify-center text-lg">
            ✨
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Hey, I'm <span className="text-gradient">Tony</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Developer, writer, and perpetual student of life. Building things on the internet and sharing what I learn along the way.
        </p>
      </section>

      {/* Quick Facts */}
      <section className="grid grid-cols-3 gap-4 mb-16 opacity-0 animate-fade-in-up animation-delay-100">
        <Card className="bg-card/50 border-border/50 text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">🌏</div>
            <div className="text-sm text-muted-foreground">Based in</div>
            <div className="font-semibold">Tokyo, Japan</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">💼</div>
            <div className="text-sm text-muted-foreground">Working as</div>
            <div className="font-semibold">Developer</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 text-center">
          <CardContent className="pt-6">
            <div className="text-3xl mb-2">☕</div>
            <div className="text-sm text-muted-foreground">Fueled by</div>
            <div className="font-semibold">Coffee</div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12 opacity-0 animate-fade-in-up animation-delay-100" />

      {/* Bio Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up animation-delay-200">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">01.</span> About Me
        </h2>
        <div className="prose">
          <p>
            I'm a software developer with a passion for building elegant solutions to complex problems.
            My journey into tech started with curiosity about how things work, and that curiosity has
            never faded.
          </p>
          <p>
            When I'm not coding, you'll find me reading, exploring new places, or diving into the
            latest tech rabbit hole. I believe in learning in public and sharing knowledge freely—which
            is exactly why I started <strong>sekai</strong>.
          </p>
          <p>
            In Japanese, <strong>sekai (世界)</strong> means "world" or "universe." This blog is my
            little corner of the digital universe—a space to explore ideas, document my journey, and
            hopefully inspire others along the way.
          </p>
        </div>
      </section>

      {/* Skills Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up animation-delay-200">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">02.</span> Tech Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="px-3 py-1.5 text-sm bg-secondary/80 hover:bg-primary/20 hover:text-primary transition-colors"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      {/* Interests Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up animation-delay-300">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">03.</span> When I'm Not Coding
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {interests.map((interest) => (
            <div
              key={interest.label}
              className="text-center p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="text-2xl mb-2">{interest.emoji}</div>
              <div className="text-sm text-muted-foreground">{interest.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up animation-delay-300">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">04.</span> Journey So Far
        </h2>
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-16 text-sm font-mono text-primary">
                {item.year}
              </div>
              <div className="flex-shrink-0 w-3 h-3 rounded-full bg-primary mt-1.5" />
              <div className="text-muted-foreground">{item.event}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Connect Section */}
      <section className="mb-16 opacity-0 animate-fade-in-up animation-delay-400">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">05.</span> Let's Connect
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group"
          >
            <div className="text-2xl mb-2">𝕏</div>
            <div className="font-medium group-hover:text-primary transition-colors">Twitter</div>
            <div className="text-sm text-muted-foreground">@tonyduong</div>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group"
          >
            <div className="text-2xl mb-2">🐙</div>
            <div className="font-medium group-hover:text-primary transition-colors">GitHub</div>
            <div className="text-sm text-muted-foreground">@tonyduong</div>
          </a>
          <a
            href="mailto:hello@example.com"
            className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group"
          >
            <div className="text-2xl mb-2">✉️</div>
            <div className="font-medium group-hover:text-primary transition-colors">Email</div>
            <div className="text-sm text-muted-foreground">Say hello!</div>
          </a>
        </div>
      </section>

      {/* CTA */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-card/50 to-accent/10 border border-border/50 text-center opacity-0 animate-fade-in-up animation-delay-500">
        <h3 className="text-xl font-semibold mb-2">Thanks for visiting! 🙏</h3>
        <p className="text-muted-foreground mb-4">
          Feel free to explore my posts or reach out if you want to chat.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Read my posts →
        </a>
      </div>
    </div>
  );
}
