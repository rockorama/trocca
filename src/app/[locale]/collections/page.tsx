import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/db/index";
import { buildWorldCup2026 } from "@/db/seed-data";
import { clerkEnabled, dbEnabled, getCurrentUserId } from "@/lib/auth";
import { listVisibleCollections, type CollectionSummary } from "@/db/collections-repo";

// The list reflects per-user visibility from the DB when configured, so it's
// rendered per-request rather than prerendered; offline it falls back to seed.
export const dynamic = "force-dynamic";

async function loadCollections(): Promise<CollectionSummary[]> {
  if (dbEnabled) {
    const userId = clerkEnabled ? await getCurrentUserId() : null;
    return listVisibleCollections(db, userId);
  }
  // Offline fallback: the single seeded demo album.
  const wc = buildWorldCup2026();
  return [
    {
      slug: wc.slug,
      name: wc.name,
      publisher: wc.publisher,
      year: wc.year,
      isOfficial: false,
      itemCount: wc.items.length,
      mine: false,
    },
  ];
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const available = await loadCollections();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("collections.title")}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{t("collections.subtitle")}</p>
        </div>
        {clerkEnabled && (
          <Link
            href="/collections/new"
            className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t("collections.create")}
          </Link>
        )}
      </div>

      <ul className="mt-8 space-y-3">
        {available.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/collections/${c.slug}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-5 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-slate-800 dark:hover:bg-emerald-950/20"
            >
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {c.name}
                  {c.isOfficial && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {t("collections.verified")}
                    </span>
                  )}
                  {c.mine && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {t("collections.mine")}
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {c.publisher ? `${c.publisher} · ` : ""}
                  {t("collections.items", { count: c.itemCount })}
                </p>
              </div>
              <span aria-hidden className="text-emerald-600">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
