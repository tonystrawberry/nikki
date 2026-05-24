import { notFound } from "next/navigation";
import { CloneChat } from "@/components/CloneChat";
import { hasLocale, getDictionary } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) return { title: "Not Found" };
  const dict = await getDictionary(locale);
  return { title: `${dict.chat.title} | nikki`, description: dict.chat.subtitle };
}

export default async function ChatPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          {dict.chat.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {dict.chat.subtitle}
        </p>
      </header>
      <CloneChat locale={locale} dict={dict.chat} />
    </div>
  );
}
