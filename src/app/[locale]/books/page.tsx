import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, getDictionary } from "@/lib/i18n";
import { getBooks } from "@/lib/books";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const DATE_LOCALES = { fr: "fr-FR", en: "en-US", ja: "ja-JP" } as const;

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    return { title: "Not Found" };
  }

  const dict = await getDictionary(locale);

  return {
    title: `${dict.books.title} | nikki`,
    description: dict.books.subtitle,
  };
}

export default async function BooksPage({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const books = getBooks();
  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(DATE_LOCALES[locale], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-16">
      <section className="mb-8 sm:mb-12 opacity-0 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          <span className="text-gradient">{dict.books.title}</span>
        </h1>
        <p className="text-muted-foreground">{dict.books.subtitle}</p>
        {books.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {books.length} {books.length === 1 ? dict.books.book : dict.books.books}
          </p>
        )}
      </section>

      {books.length === 0 ? (
        <p className="text-muted-foreground">{dict.books.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 opacity-0 animate-fade-in-up animation-delay-100">
          {books.map((book) => (
            <li key={`${book.title}-${book.readAt}`} className="flex flex-col">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border/40 bg-muted shadow-sm">
                {book.cover ? (
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    sizes="(min-width: 768px) 200px, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center text-sm font-medium text-muted-foreground">
                    {book.title}
                  </div>
                )}
              </div>
              <h2 className="mt-3 text-sm font-semibold leading-snug">{book.title}</h2>
              <p className="text-sm text-muted-foreground">{book.author}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {dict.books.readOn} <time dateTime={book.readAt}>{formatDate(book.readAt)}</time>
              </p>
              {(book.collection || book.post) && (
                <Link
                  href={
                    book.collection
                      ? `/${locale}/collection/${book.collection}`
                      : `/${locale}/posts/${book.post}`
                  }
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  {dict.books.notes}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
