import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildWorldCup2026 } from "@/db/seed-data";
import { CollectionTracker } from "@/components/CollectionTracker";

/** Resolve a collection by slug. Currently only the seeded WC 2026 album. */
function getCollection(slug: string) {
  const wc = buildWorldCup2026();
  return slug === wc.slug ? wc : null;
}

export function generateStaticParams() {
  return [{ slug: buildWorldCup2026().slug }];
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const collection = getCollection(slug);
  if (!collection) notFound();

  const t = await getTranslations();

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-8">
      <Link href="/collections" className="text-sm text-slate-500 hover:underline">
        ← {t("collections.title")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{collection.name}</h1>
      <p className="text-sm text-slate-500">{t("collections.yourProgress")}</p>

      <div className="mt-6">
        <CollectionTracker slug={collection.slug} items={collection.items} />
      </div>
    </main>
  );
}
