"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { parseCatalogCsv } from "@/lib/csv-catalog";
import { groupBySection } from "@/lib/sections";
import type { CreateCollectionInput, CreateCollectionResult } from "@/lib/actions/collections";

interface Props {
  onCreate: (input: CreateCollectionInput) => Promise<CreateCollectionResult>;
}

const PLACEHOLDER = `code,name,section,rarity
BRA-01,Brazil — Player 1,Brazil,base
BRA-02,Brazil — Player 2,Brazil,base
FWC-LOGO,Official Emblem,,special`;

/** Create-an-album form with a live, parsed preview before saving. */
export function NewCollectionForm({ onCreate }: Props) {
  const t = useTranslations("create");
  const router = useRouter();

  const [name, setName] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [csv, setCsv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const parsed = useMemo(() => parseCatalogCsv(csv), [csv]);
  const sections = useMemo(
    () => (parsed.items.length > 0 ? groupBySection(parsed.items) : []),
    [parsed.items],
  );

  const canSubmit =
    name.trim() !== "" && parsed.items.length > 0 && parsed.errors.length === 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setServerErrors([]);
    try {
      const result = await onCreate({
        name: name.trim(),
        publisher: publisher.trim() || undefined,
        year: year.trim() ? Number(year) : undefined,
        csv,
      });
      if (result.ok && result.slug) {
        router.push(`/collections/${result.slug}`);
      } else {
        setServerErrors(result.errors ?? [t("genericError")]);
        setSubmitting(false);
      }
    } catch {
      setServerErrors([t("genericError")]);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label={t("nameLabel")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </Field>
        <div className="flex gap-4">
          <Field label={t("publisherLabel")}>
            <input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </Field>
          <Field label={t("yearLabel")}>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="w-28 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </Field>
        </div>
        <Field label={t("csvLabel")}>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={12}
            placeholder={PLACEHOLDER}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <p className="mt-1 text-xs text-slate-500">{t("csvHint")}</p>
        </Field>

        {serverErrors.length > 0 && (
          <ul className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {serverErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {submitting ? t("creating") : t("createButton")}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("preview")}
        </h2>

        {parsed.errors.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-red-600 dark:text-red-400">
            {parsed.errors.map((err) => (
              <li key={err}>⚠ {err}</li>
            ))}
          </ul>
        )}

        {parsed.items.length > 0 ? (
          <>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {t("itemCount", { count: parsed.items.length })} ·{" "}
              {t("sectionCount", { count: sections.length })}
            </p>
            <div className="mt-4 max-h-80 space-y-4 overflow-auto">
              {sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {section.label || section.kind}
                  </h3>
                  <ul className="mt-1 text-sm">
                    {section.items.map((item) => (
                      <li key={item.code} className="flex justify-between gap-2 py-0.5">
                        <span className="font-mono text-xs text-slate-500">{item.code}</span>
                        <span className="truncate text-right">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          parsed.errors.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">{t("previewEmpty")}</p>
          )
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
