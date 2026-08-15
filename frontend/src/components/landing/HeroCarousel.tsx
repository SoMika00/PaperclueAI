"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";

const SLIDES: { image: string; titleKey: DictKey }[] = [
  { image: "/img/hero1.png", titleKey: "lp_hero_s1" },
  { image: "/img/hero2.png", titleKey: "lp_hero_s2" },
  { image: "/img/hero3.png", titleKey: "lp_hero_s3" },
];

export default function HeroCarousel() {
  const { t } = useLocale();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full h-[68vh] min-h-[440px] max-h-[720px] overflow-hidden bg-ink">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== current}
        >
          <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* Navy-tinted gradient overlay keeps text legible and on-brand */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/25" />
        </div>
      ))}

      {/* Content overlay (tracks the active slide title) */}
      <div className="relative z-10 flex h-full items-end">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 pb-14 sm:pb-20">
          <div className="max-w-3xl">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wide text-brand bg-brand-soft/95 border border-brand/40 rounded-full px-3 py-1 mb-5">
              {t("landing_demo_badge")}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white">
              {t(SLIDES[current].titleKey)}
            </h1>
            <Link
              href="/login"
              className="btn btn-primary mt-7 inline-flex px-6 py-2.5 text-[15px]"
            >
              {t("landing_hero_cta")}
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-brand" : "w-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
