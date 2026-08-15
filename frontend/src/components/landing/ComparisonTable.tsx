"use client";

import { Check, X, AlertTriangle, BadgeCheck } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";

type GenericStatus = "bad" | "warn";

const ROWS: { n: number; status: GenericStatus }[] = [
  { n: 1, status: "bad" },
  { n: 2, status: "warn" },
  { n: 3, status: "bad" },
  { n: 4, status: "bad" },
  { n: 5, status: "warn" },
  { n: 6, status: "bad" },
  { n: 7, status: "warn" },
  { n: 8, status: "bad" },
  { n: 9, status: "bad" },
  { n: 10, status: "warn" },
  { n: 11, status: "warn" },
];

export default function ComparisonTable() {
  const { t } = useLocale();
  const k = (s: string) => t(s as DictKey);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 py-20">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep">
          <BadgeCheck className="h-6 w-6" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{k("lp_cmp_title")}</h2>
        <p className="text-inkmut dark:text-dark-inkmut mt-3 text-[15px] leading-relaxed">
          {k("lp_cmp_subtitle")}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line dark:border-dark-line bg-surface2 dark:bg-dark-surface2 text-left">
                <th className="px-6 py-5 w-1/3 align-top">
                  <div className="font-semibold text-[15px]">{k("lp_cmp_col_feature")}</div>
                  <div className="text-[12px] text-inkmut dark:text-dark-inkmut font-normal mt-0.5">
                    {k("lp_cmp_col_feature_sub")}
                  </div>
                </th>
                <th className="px-6 py-5 w-1/3 text-center align-top">
                  <div className="font-semibold text-[15px] text-inkmut dark:text-dark-inkmut">
                    {k("lp_cmp_col_generic")}
                  </div>
                  <div className="text-[12px] text-inkmut dark:text-dark-inkmut font-normal mt-0.5">
                    {k("lp_cmp_col_generic_sub")}
                  </div>
                </th>
                <th className="px-6 py-5 w-1/3 text-center align-top">
                  <div className="font-semibold text-[15px] text-brand-deep">
                    {k("lp_cmp_col_pc")}
                  </div>
                  <div className="text-[12px] text-brand-deep/80 font-normal mt-0.5">
                    {k("lp_cmp_col_pc_sub")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ n, status }) => (
                <tr
                  key={n}
                  className="border-b border-line/60 dark:border-dark-line/60 last:border-0 hover:bg-surface2/60 dark:hover:bg-dark-surface2/40 transition-colors"
                >
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-[14px]">{k(`lp_cmp_r${n}_feat`)}</div>
                    <div className="text-[12px] text-inkmut dark:text-dark-inkmut mt-0.5">
                      {k(`lp_cmp_r${n}_sub`)}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                        status === "bad"
                          ? "border-danger/30 bg-danger/5 text-danger"
                          : "border-warn/30 bg-warn/10 text-warn"
                      }`}
                    >
                      {status === "bad" ? (
                        <X className="h-4 w-4 mt-0.5 flex-none" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-none" />
                      )}
                      <span className="text-[13px] font-medium leading-snug">
                        {k(`lp_cmp_r${n}_generic`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-2 rounded-lg border border-manuscript/30 bg-manuscript-soft px-3 py-2 text-manuscript">
                      <Check className="h-4 w-4 mt-0.5 flex-none" />
                      <span className="text-[13px] font-medium leading-snug">
                        {k(`lp_cmp_r${n}_pc`)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
