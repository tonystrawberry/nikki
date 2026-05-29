import { notFound } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { hasLocale, getDictionary } from "@/lib/i18n";
import ChatContactCard from "@/components/ChatContactCard";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    return { title: "Not Found" };
  }

  const dict = await getDictionary(locale);

  return {
    title: `${dict.about.title} | nikki`,
    description: dict.about.subtitle,
  };
}

const interests = [
  { emoji: "📖", label: { fr: "Lecture", en: "Reading", ja: "読書" } },
  { emoji: "🎮", label: { fr: "Jeux vidéo", en: "Gaming", ja: "ゲーム" } },
  { emoji: "🎬", label: { fr: "Cinéma", en: "Movies", ja: "映画" } },
  { emoji: "✈️", label: { fr: "Voyages", en: "Travel", ja: "旅行" } },
  { emoji: "🍜", label: { fr: "Cuisine", en: "Food", ja: "グルメ" } },
  { emoji: "🎵", label: { fr: "Musique", en: "Music", ja: "音楽" } },
];

const bio = {
  fr: {
    intro: "Je m'appelle Tony. Je vis à Tokyo et je travaille comme développeur.",
    why: "J'ai créé ce journal pour documenter ma vie, mes pensées et mes expériences. C'est un espace personnel où je peux écrire librement sur tout ce qui me passe par la tête.",
    topics: "Tu y trouveras des réflexions sur la vie, des reviews de films que j'ai aimés, des notes sur mon travail, et parfois juste des pensées random de mon quotidien.",
    hope: "J'espère que ces écrits pourront parfois te parler, ou au moins te divertir.",
  },
  en: {
    intro: "My name is Tony. I live in Tokyo and work as a developer.",
    why: "I created this diary to document my life, thoughts, and experiences. It's a personal space where I can freely write about anything that comes to mind.",
    topics: "You'll find reflections on life, reviews of movies I loved, notes about my work, and sometimes just random thoughts from my daily life.",
    hope: "I hope these writings can sometimes speak to you, or at least entertain you.",
  },
  ja: {
    intro: "私の名前はTonyです。東京に住んでいて、開発者として働いています。",
    why: "この日記を作ったのは、自分の人生、考え、経験を記録するためです。頭に浮かぶことを自由に書ける個人的な空間です。",
    topics: "人生についての考え、好きだった映画のレビュー、仕事についてのメモ、そして時には日常のランダムな思考が見つかります。",
    hope: "これらの文章があなたに響くことがあれば、少なくとも楽しんでもらえれば嬉しいです。",
  },
};

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const content = bio[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      {/* Hero Section with Avatar */}
      <section className="text-center mb-10 sm:mb-16 opacity-0 animate-fade-in-up">
        <div className="relative inline-block mb-4 sm:mb-6">
          <Image src="/images/avatar.png" alt="Tony" width={128} height={128} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
          {locale === 'fr' ? 'Salut, moi c\'est' : locale === 'ja' ? 'こんにちは、' : "Hey, I'm"}{" "}
          <span className="text-gradient">Tony</span>
          {locale === 'ja' && 'です'}
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {dict.about.subtitle}
        </p>
      </section>

      {/* Quick Facts */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4 mb-10 sm:mb-16 opacity-0 animate-fade-in-up animation-delay-100">
        <Card className="bg-card/50 border-border/50 text-center">
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🗼</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {locale === 'fr' ? 'Basé à' : locale === 'ja' ? '拠点' : 'Based in'}
            </div>
            <div className="font-semibold text-sm sm:text-base">Tokyo</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 text-center">
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💻</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {locale === 'fr' ? 'Métier' : locale === 'ja' ? '職業' : 'Work'}
            </div>
            <div className="font-semibold text-sm sm:text-base">
              {locale === 'fr' ? 'Dev' : locale === 'ja' ? '開発者' : 'Dev'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 text-center">
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">☕</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {locale === 'fr' ? 'Carburant' : locale === 'ja' ? '燃料' : 'Fuel'}
            </div>
            <div className="font-semibold text-sm sm:text-base">
              {locale === 'fr' ? 'Café' : locale === 'ja' ? 'コーヒー' : 'Coffee'}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 sm:my-12 opacity-0 animate-fade-in-up animation-delay-100" />

      {/* Bio Section */}
      <section className="mb-10 sm:mb-16 opacity-0 animate-fade-in-up animation-delay-200">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-primary">01.</span>
          {locale === 'fr' ? 'Pourquoi ce journal' : locale === 'ja' ? 'なぜこの日記を' : 'Why this diary'}
        </h2>
        <div className="prose prose-mobile">
          <p>{content.intro}</p>
          <p>{content.why}</p>
          <p>{content.topics}</p>
          <p className="text-muted-foreground italic">{content.hope}</p>
        </div>
      </section>

      {/* Interests Section */}
      <section className="mb-10 sm:mb-16 opacity-0 animate-fade-in-up animation-delay-300">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-primary">02.</span>
          {locale === 'fr' ? 'Ce qui m\'intéresse' : locale === 'ja' ? '興味があること' : 'Things I like'}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          {interests.map((interest) => (
            <div
              key={interest.emoji}
              className="text-center p-2 sm:p-4 rounded-lg sm:rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{interest.emoji}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{interest.label[locale]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Connect Section */}
      <section className="mb-10 sm:mb-16 opacity-0 animate-fade-in-up animation-delay-400">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-primary">03.</span> {dict.about.connect}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <a
            href="https://github.com/tonystrawberry"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
          >
            <div className="text-2xl sm:mb-2">🐙</div>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">GitHub</div>
              <div className="text-sm text-muted-foreground">@tonystrawberry</div>
            </div>
          </a>
          <a
            href="mailto:tony.duong.102@gmail.com"
            className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
          >
            <div className="text-2xl sm:mb-2">✉️</div>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">Email</div>
              <div className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Pour les sujets sérieux' : locale === 'ja' ? '正式なお問い合わせ' : 'For serious matters'}
              </div>
            </div>
          </a>
          <ChatContactCard locale={locale} />
        </div>
      </section>

      {/* CTA */}
      <div className="p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-card/50 to-accent/10 border border-border/50 text-center opacity-0 animate-fade-in-up animation-delay-500">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">{dict.about.thanks}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          {locale === 'fr'
            ? "N'hésite pas à parcourir mes entrées."
            : locale === 'ja'
            ? '日記を読んでみてください。'
            : 'Feel free to browse my entries.'
          }
        </p>
        <a
          href={`/${locale}`}
          className="inline-block px-5 sm:px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base"
        >
          {dict.about.readPosts}
        </a>
      </div>
    </div>
  );
}
