"use client";
/* "What Researchers Say" — recreated from the original testimonials-carousel.tsx.
   Names/quotes are the client's own site content, kept verbatim. */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";

const ITEMS: { nameKey: DictKey; roleKey: DictKey; contentKey: DictKey }[] = [
  { nameKey: "lp_testi_1_name", roleKey: "lp_testi_1_role", contentKey: "lp_testi_1_content" },
  { nameKey: "lp_testi_2_name", roleKey: "lp_testi_2_role", contentKey: "lp_testi_2_content" },
  { nameKey: "lp_testi_3_name", roleKey: "lp_testi_3_role", contentKey: "lp_testi_3_content" },
  { nameKey: "lp_testi_4_name", roleKey: "lp_testi_4_role", contentKey: "lp_testi_4_content" },
  { nameKey: "lp_testi_5_name", roleKey: "lp_testi_5_role", contentKey: "lp_testi_5_content" },
];

function initials(name: string) {
  return name
    .replace(/^(Dr\.|Prof\.)\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function TestimonialsCarousel() {
  const { t } = useLocale();
  const [start, setStart] = useState(0);
  const perView = 3;
  const maxStart = Math.max(0, ITEMS.length - perView);

  const prev = () => setStart((p) => (p === 0 ? maxStart : p - 1));
  const next = () => setStart((p) => (p === maxStart ? 0 : p + 1));

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16 sm:py-24">
      <h2 className="font-inter text-2xl sm:text-3xl font-semibold text-center mb-10">
        {t("lp_testi_title")}
      </h2>

      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${start * (100 / perView)}%)` }}
          >
            {ITEMS.map((item) => {
              const name = t(item.nameKey);
              return (
                <div key={item.nameKey} className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-3">
                  <div className="card p-6 h-full flex flex-col">
                    <Quote className="h-6 w-6 text-pcblue" />
                    <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 italic mt-3 flex-grow">
                      &ldquo;{t(item.contentKey)}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-5">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-pcblue-light text-pcblue dark:bg-pcblue/15 font-semibold text-[13px]">
                        {initials(name)}
                      </span>
                      <div>
                        <div className="font-semibold text-[14px]">{name}</div>
                        <div className="text-[12px] text-slate-600 dark:text-slate-300">
                          {t(item.roleKey)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={prev}
          aria-label="Previous testimonials"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={next}
          aria-label="Next testimonials"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex justify-center mt-8 gap-2">
        {Array.from({ length: maxStart + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStart(i)}
            aria-label={`Go to testimonial group ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              start === i ? "w-6 bg-pcblue" : "w-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
