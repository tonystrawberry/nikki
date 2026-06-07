"use client";

/**
 * JOURNAL TABS - src/components/JournalTabs.tsx
 * =============================================
 *
 * Segmented tab control shown on the Journal (home) page, above the
 * "browse by theme" section. Switches between Articles, Collections, and
 * Search — all embedded on the same page. Purely presentational: the parent
 * (PostList) owns the active-tab state and the panel content.
 */

export type JournalTab = "articles" | "collections" | "search";

interface JournalTabsProps {
  active: JournalTab;
  onChange: (tab: JournalTab) => void;
  labels: Record<JournalTab, string>;
}

const TABS: { key: JournalTab; icon: string }[] = [
  { key: "articles", icon: "📰" },
  { key: "collections", icon: "📚" },
  { key: "search", icon: "🔍" },
];

export function JournalTabs({ active, onChange, labels }: JournalTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Journal sections"
      className="flex gap-1 sm:gap-2 border-b border-border/50 mb-6 sm:mb-8 opacity-0 animate-fade-in-up animation-delay-100"
    >
      {TABS.map(({ key, icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`relative -mb-px border-b-2 px-3 sm:px-4 py-2.5 text-sm sm:text-base font-medium transition-colors ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <span className="mr-1.5">{icon}</span>
            {labels[key]}
          </button>
        );
      })}
    </div>
  );
}
