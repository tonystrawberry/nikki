"use client";

import type { Locale } from "@/lib/i18n-config";

interface ResumeActionsProps {
  locale: Locale;
  downloadLabel: string;
  pdfHref: string;
  pdfFileName: string;
  printLabel: string;
  emailLabel: string;
  email: string;
}

/**
 * Download / print / contact actions for the resume page.
 *
 * Client component because Print calls window.print(). The `no-print` class
 * hides these controls from the printed/PDF output (see globals.css @media print).
 */
export default function ResumeActions({
  locale,
  downloadLabel,
  pdfHref,
  pdfFileName,
  printLabel,
  emailLabel,
  email,
}: ResumeActionsProps) {
  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-3">
      <a
        href={pdfHref}
        download={pdfFileName}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        {downloadLabel}
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-card cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        {printLabel}
      </button>
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-card"
        lang={locale}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {emailLabel}
      </a>
    </div>
  );
}
