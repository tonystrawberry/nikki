import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * The AI clone chat has been merged into the About page ("Ask my AI clone").
 * This route now redirects there so old links keep working.
 */
export default async function ChatPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  redirect(`/${locale}/about#ask-my-clone`);
}
