"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { collectionStats, type Holdings } from "@/domain/collection";
import { groupBySection, type CatalogItem } from "@/lib/sections";
import {
  useLocalHoldings,
  readLocalHoldings,
  clearLocalHoldings,
} from "@/lib/useLocalHoldings";

interface Props {
  slug: string;
  items: CatalogItem[];
  /** When true, holdings persist to the user's account instead of localStorage. */
  signedIn?: boolean;
  /** The account's stored holdings (only meaningful when `signedIn`). */
  serverHoldings?: Holdings;
  /** Server action: persist one item's count. Provided only when signed in. */
  onSetCount?: (code: string, count: number) => Promise<void>;
  /** Server action: merge offline holdings into the account; returns the merge. */
  onMerge?: (local: Holdings) => Promise<Holdings>;
}

/**
 * Account-backed holdings: seeded from the server, written through a server
 * action (optimistically), and reconciled once with any offline holdings left in
 * localStorage from before sign-in (per-item max, server-side).
 */
function useServerHoldings(
  slug: string,
  serverHoldings: Holdings,
  onSetCount?: (code: string, count: number) => Promise<void>,
  onMerge?: (local: Holdings) => Promise<Holdings>,
): [Holdings, (code: string, count: number) => void] {
  const [counts, setCounts] = useState<Holdings>(serverHoldings);
  const mergeStarted = useRef(false);

  // Per-item write coordination: `pending` holds the latest intended count for
  // each code; `flushing` tracks which codes have an active writer. This makes
  // saves for a given item strictly serial and last-write-wins, so a slow save
  // of an older value can never clobber a newer one (the race @codex flagged).
  const pending = useRef<Map<string, number>>(new Map());
  const flushing = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!onMerge || mergeStarted.current) return;
    mergeStarted.current = true;
    const local = readLocalHoldings(slug);
    if (Object.keys(local).length === 0) return;
    let active = true;
    onMerge(local)
      .then((merged) => {
        if (!active) return;
        setCounts(merged);
        clearLocalHoldings(slug);
      })
      .catch((err) => console.error("Failed to merge offline holdings", err));
    return () => {
      active = false;
    };
  }, [slug, onMerge]);

  const setCount = useCallback(
    (code: string, count: number) => {
      const safe = Math.max(0, Math.floor(count));
      setCounts((prev) => ({ ...prev, [code]: safe })); // optimistic
      if (!onSetCount) return;

      pending.current.set(code, safe);
      if (flushing.current.has(code)) return; // an active writer will pick this up
      flushing.current.add(code);
      void (async () => {
        try {
          // Drain to the latest value; new clicks during an await re-enter `pending`.
          while (pending.current.has(code)) {
            const value = pending.current.get(code)!;
            pending.current.delete(code);
            await onSetCount(code, value);
          }
        } catch (err) {
          console.error("Failed to save count", err);
        } finally {
          flushing.current.delete(code);
        }
      })();
    },
    [onSetCount],
  );

  return [counts, setCount];
}

/**
 * Collection tracker. Offline-first: holdings live in localStorage so the album
 * is usable before sign-in. When signed in, holdings persist to the account and
 * any offline progress is merged in once. All progress math comes from the
 * tested domain layer.
 */
export function CollectionTracker({
  slug,
  items,
  signedIn = false,
  serverHoldings = {},
  onSetCount,
  onMerge,
}: Props) {
  const t = useTranslations("tracker");
  const tc = useTranslations("collection");
  const [missingOnly, setMissingOnly] = useState(false);

  // Both hooks run unconditionally (rules of hooks); we select the active source.
  const [localCounts, setLocalCount] = useLocalHoldings(slug);
  const [serverCounts, setServerCount] = useServerHoldings(
    slug,
    serverHoldings,
    onSetCount,
    onMerge,
  );
  const counts = signedIn ? serverCounts : localCounts;
  const setCount = signedIn ? setServerCount : setLocalCount;

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
