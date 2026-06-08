import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { clerkEnabled, getCurrentUserId } from "@/lib/auth";
import { NewCollectionForm } from "@/components/NewCollectionForm";
import { createCollectionFromCsv } from "@/lib/actions/collections";

export default async function NewCollectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("create");

  const userId = clerkEnabled ? await getCurrentUserId() : null;

  return (
    <main className="mx-auto max-w-5xl flex-1 px-6 py-10">
      <Link href="/collections" className="text-sm text-slate-500 hover:underline">
        ← {t("back")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">{t("subtitle")}</p>

      <div className="mt-8">
        {userId ? (
          <NewCollectionForm onCreate={createCollectionFromCsv} />
        ) : (
          <p className="rounded-xl border border-slate-200 p-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {t("signInRequired")}
          </p>
        )}
      </div>
    </main>
  );
}
