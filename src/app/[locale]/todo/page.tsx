import { notFound } from "next/navigation";
import { hasLocale, getDictionary } from "@/lib/i18n";
import { getTodos } from "@/lib/todos";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    title: `${dict.todo.title} | nikki`,
    description: dict.todo.subtitle,
  };
}

export default async function TodoPage({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const items = getTodos();
  const pending = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      <section className="mb-8 sm:mb-12 opacity-0 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          <span className="text-gradient">{dict.todo.title}</span>
        </h1>
        <p className="text-muted-foreground">{dict.todo.subtitle}</p>
      </section>

      <section className="space-y-6 opacity-0 animate-fade-in-up animation-delay-100">
        {/* Pending */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary">◇</span>
              {dict.todo.toDo}
              {pending.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({pending.length})
                </span>
              )}
            </h2>
          </CardHeader>
          <CardContent className="pt-0">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{dict.todo.emptyPending}</p>
            ) : (
              <ul className="space-y-2">
                {pending.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/50 border border-border/30"
                  >
                    <span className="text-xs font-mono text-muted-foreground tabular-nums w-6">
                      #{item.id}
                    </span>
                    <span>{item.text}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.createdAt}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary">✓</span>
              {dict.todo.done}
              {completed.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({completed.length})
                </span>
              )}
            </h2>
          </CardHeader>
          <CardContent className="pt-0">
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{dict.todo.emptyDone}</p>
            ) : (
              <ul className="space-y-2">
                {completed.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/30 border border-border/20 opacity-80"
                  >
                    <span className="text-xs font-mono text-muted-foreground tabular-nums w-6">
                      #{item.id}
                    </span>
                    <span className="line-through text-muted-foreground">{item.text}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.completedAt ?? item.createdAt}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="mt-6 text-xs text-muted-foreground opacity-0 animate-fade-in-up animation-delay-200">
        {dict.todo.hint}
      </p>
    </div>
  );
}
