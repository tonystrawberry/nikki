"use client";

import type { Locale } from "@/lib/i18n-config";

const labels: Record<Locale, string> = {
  fr: "Discuter en direct",
  en: "Chat in real time",
  ja: "リアルタイムで話す",
};

export default function ChatContactCard({ locale }: { locale: Locale }) {
  return (
    <button
      onClick={() => {
        const chatBtn = document.querySelector<HTMLButtonElement>(
          'button[aria-label]'
        );
        if (chatBtn) chatBtn.click();
      }}
      className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 text-left cursor-pointer w-full"
    >
      <div className="text-2xl sm:mb-2">💬</div>
      <div>
        <div className="font-medium group-hover:text-primary transition-colors">
          Chat
        </div>
        <div className="text-sm text-muted-foreground">{labels[locale]}</div>
      </div>
    </button>
  );
}
