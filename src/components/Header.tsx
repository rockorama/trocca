import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { clerkEnabled } from "@/lib/auth";
import { AuthControls } from "./AuthControls";
import { LocaleSwitcher } from "./LocaleSwitcher";

/** App header: brand, primary nav, locale switcher and (when configured) auth. */
export async function Header() {
  const t = await getTranslations("nav");
  const tApp = await getTranslations("app");

  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {tApp("name")}
        </Link>
        <nav className="hidden gap-5 text-sm text-slate-600 dark:text-slate-300 sm:flex">
          <Link href="/collections" className="hover:text-emerald-600">
            {t("collections")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {clerkEnabled ? <AuthControls signIn={t("signIn")} /> : null}
        </div>
      </div>
    </header>
  );
}
