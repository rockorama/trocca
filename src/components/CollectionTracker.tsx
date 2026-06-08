"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { collectionStats } from "@/domain/collection";
import { groupBySection, type CatalogItem } from "@/lib/sections";
import { useLocalHoldings } from "@/lib/useLocalHoldings";

interface Props {
  slug: string;
  items: CatalogItem[];
}

/**
 * Offline-capable collection tracker. Holdings live in localStorage so the album
 * is usable before sign-in; the same shape maps 1:1 onto the `user_items` table
 * for later server sync. All progress math comes from the tested domain layer.
 */
export function CollectionTracker({ slug, items }: Props) {
  const t = useTranslations("tracker");
  const tc = useTranslations("collection");
  const [counts, setCount] = useLocalHoldings(slug);
  const [missingOnly, setMissingOnly] = useState(false);

  const catalog = useMemo(() => items.map((i) => i.code), [items]);
  const stats = useMemo(() => collectionStats(catalog, counts), [catalog, counts]);
  const sections = useMemo(() => groupBySection(items), [items]);

  const percent = Math.round(stats.completion * 100);

  const sectionTitle = (kind: string, label: string) =>
    kind === "specials" ? t("specials") : kind === "cities" ? t("cities") : label;

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-5 text-sm">
            <Stat label={tc("owned")} value={stats.owned} />
            <Stat label={tc("missing")} value={stats.missing} />
            <Stat label={tc("extras")} value={stats.extras} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={missingOnly}
              onChange={(e) => setMissingOnly(e.target.checked)}
              className="h-4 w-4"
            />
            {t("filterMissing")}
          </label>
        </div>
        <div className="mt-3">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">
            {tc("complete", { percent })}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {sections.map((section) => {
          const visible = missingOnly
            ? section.items.filter((i) => (counts[i.code] ?? 0) === 0)
            : section.items;
          if (visible.length === 0) return null;
          return (
            <section key={section.id}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {sectionTitle(section.kind, section.label)}
              </h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((item) => {
                  const count = counts[item.code] ?? 0;
                  const owned = count >= 1;
                  const spare = Math.max(0, count - 1);
                  return (
                    <li
                      key={item.code}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                        owned
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.code}</p>
                        <p className="truncate text-xs text-slate-500">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`${t("decrease")} ${item.code}`}
                          onClick={() => setCount(item.code, count - 1)}
                          disabled={count === 0}
                          className="h-7 w-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-30 dark:border-slate-700"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums" aria-label={`${item.code} ${tc("owned")}`}>
                          {count}
                        </span>
                        <button
                          type="button"
                          aria-label={`${t("increase")} ${item.code}`}
                          onClick={() => setCount(item.code, count + 1)}
                          className="h-7 w-7 rounded-full border border-slate-300 text-slate-600 dark:border-slate-700"
                        >
                          +
                        </button>
                        {spare > 0 && (
                          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            +{spare}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex flex-col">
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </span>
  );
}
