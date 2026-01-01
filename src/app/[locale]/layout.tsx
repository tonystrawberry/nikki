import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Outfit, Crimson_Pro, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { locales, hasLocale, getDictionary, type Locale } from "@/lib/i18n";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    return { title: "nikki" };
  }

  const dict = await getDictionary(locale);

  return {
    title: "nikki | " + dict.footer.tagline,
    description: dict.home.tagline,
    keywords: ["blog", "diary", "journal", "personal"],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);

  return (
    <html lang={locale} className="dark">
      <body className={`${outfit.variable} ${crimsonPro.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col gradient-bg font-sans`}>
        <Header locale={locale} dict={dict} />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
