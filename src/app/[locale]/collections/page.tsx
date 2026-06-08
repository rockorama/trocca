import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildWorldCup2026 } from "@/db/seed-data";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // For now the catalog list comes from the seeded generator; later this reads
  // the `collections` table (community + official).
  const wc = buildWorldCup2026();
  const available = [wc];

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold">{t("collections.title")}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">{t("collections.subtitle")}</p>

      <ul className="mt-8 space-y-3">
        {available.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/collections/${c.slug}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-5 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-slate-800 dark:hover:bg-emerald-950/20"
            >
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-slate-500">
                  {c.publisher} · {t("collections.items", { count: c.items.length })}
                </p>
              </div>
              <span aria-hidden className="text-emerald-600">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
