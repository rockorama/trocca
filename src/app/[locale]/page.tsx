import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const features = [
    { title: t("home.feature1Title"), body: t("home.feature1Body"), icon: "🗂️" },
    { title: t("home.feature2Title"), body: t("home.feature2Body"), icon: "🔁" },
    { title: t("home.feature3Title"), body: t("home.feature3Body"), icon: "🛡️" },
  ];

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-600 dark:text-slate-300">
          {t("home.heroSubtitle")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/collections"
            className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            {t("home.ctaPrimary")}
          </Link>
          <a
            href="#how"
            className="rounded-full px-6 py-3 font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-900"
          >
            {t("home.ctaSecondary")}
          </a>
        </div>
      </section>

      <section id="how" className="mx-auto grid max-w-5xl gap-8 px-6 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800"
          >
            <div className="text-3xl">{f.icon}</div>
            <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
