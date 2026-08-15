"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";

const ITEMS = [1, 2, 3, 4, 5, 6, 7];

export default function FaqAccordion() {
  const { t } = useLocale();
  const k = (s: string) => t(s as DictKey);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="w-full max-w-3xl mx-auto px-6 py-20">
      <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-center mb-10">
        {k("lp_faq_title")}
      </h2>
      <div className="space-y-3">
        {ITEMS.map((n, i) => {
          const isOpen = open === i;
          return (
            <div key={n} className="card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface2/60 dark:hover:bg-dark-surface2/40"
              >
                <span className="font-semibold text-[15px] leading-snug">{k(`lp_faq_q${n}`)}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-none text-inkmut dark:text-dark-inkmut transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 pt-0 text-[14px] leading-relaxed text-inkmut dark:text-dark-inkmut">
                    {k(`lp_faq_a${n}`)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
