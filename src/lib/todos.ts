/**
 * TODOS - src/lib/todos.ts
 * ========================
 *
 * Server-only helpers for the TODO list. Data is stored in data/todos.json.
 * Used by the /[locale]/todo page. Add/finish actions are done via .claude/commands.
 */

import "server-only";
import fs from "fs";
import path from "path";
import type { Locale } from "./i18n-config";

export interface TodoItem {
  id: number;
  /** Localized text — all locales at the same level. `en` is the fallback. */
  text: Record<Locale, string>;
  done: boolean;
  createdAt: string;
  completedAt?: string;
}

interface TodosStore {
  items: TodoItem[];
}

const TODOS_PATH = path.join(process.cwd(), "data", "todos.json");

function readStore(): TodosStore {
  try {
    const raw = fs.readFileSync(TODOS_PATH, "utf8");
    const data = JSON.parse(raw) as TodosStore;
    return Array.isArray(data.items) ? data : { items: [] };
  } catch {
    return { items: [] };
  }
}

/**
 * Returns all TODO items (pending first, then completed by completedAt/createdAt).
 */
export function getTodos(): TodoItem[] {
  const { items } = readStore();
  const pending = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done).sort((a, b) => {
    const aAt = a.completedAt ?? a.createdAt;
    const bAt = b.completedAt ?? b.createdAt;
    return bAt.localeCompare(aAt);
  });
  return [...pending, ...completed];
}

/**
 * Returns a TODO's text in the requested locale, falling back to the
 * canonical English `text` when no translation exists.
 */
export function todoText(item: TodoItem, locale: Locale): string {
  return item.text[locale]?.trim() || item.text.en;
}
