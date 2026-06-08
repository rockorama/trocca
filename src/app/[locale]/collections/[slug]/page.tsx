import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/db/index";
import { buildWorldCup2026 } from "@/db/seed-data";
import { getCollectionWithItems, type LoadedCollection } from "@/db/collections-repo";
import { CollectionTracker } from "@/components/CollectionTracker";
import { clerkEnabled, dbEnabled, getCurrentUserId } from "@/lib/auth";
import { getMyHoldings, setMyItemCount, mergeMyHoldings } from "@/lib/actions/holdings";

/** Load a collection by slug: from the DB when configured, else the seed demo. */
async function getCollection(slug: string): Promise<LoadedCollection | null> {
  if (dbEnabled) return getCollectionWithItems(db, slug);
  const wc = buildWorldCup2026();
  return slug === wc.slug ? { slug: wc.slug, name: wc.name, items: wc.items } : null;
}

// Albums are loaded per-request: from the DB when configured (user-created
// albums exist beyond the seed, and holdings are per-user), or the seed demo
// offline. Either way we render on demand rather than prerendering at build.
export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const t = await getTranslations();

  // When Clerk is configured and the user is signed in, persist to their account
  // and seed the tracker from the server; otherwise it runs offline.
  const signedIn = clerkEnabled ? Boolean(await getCurrentUserId()) : false;
  const serverHoldings = signedIn ? await getMyHoldings(slug) : {};

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-8">
      <Link href="/collections" className="text-sm text-slate-500 hover:underline">
        ← {t("collections.title")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{collection.name}</h1>
      <p className="text-sm text-slate-500">{t("collections.yourProgress")}</p>

      <div className="mt-6">
        <CollectionTracker
          // Remount per album so client-side nav between collections gets fresh
          // state and re-runs the offline merge instead of showing stale counts.
          key={collection.slug}
          slug={collection.slug}
          items={collection.items}
          signedIn={signedIn}
          serverHoldings={serverHoldings}
          onSetCount={signedIn ? setMyItemCount.bind(null, slug) : undefined}
          onMerge={signedIn ? mergeMyHoldings.bind(null, slug) : undefined}
        />
      </div>
    </main>
  );
}
