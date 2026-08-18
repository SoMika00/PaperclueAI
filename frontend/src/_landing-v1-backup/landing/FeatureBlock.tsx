"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";

interface FeatureBlockProps {
  titleKey: DictKey;
  descKey: DictKey;
  features: { titleKey: DictKey; descKey: DictKey }[];
  ctaKey: DictKey;
  image: string;
  imageAlt: string;
  reversed?: boolean; // kept for API compatibility; layout is now stacked
}

export default function FeatureBlock({
  titleKey,
  descKey,
  features,
  ctaKey,
  image,
  imageAlt,
}: FeatureBlockProps) {
  const { t } = useLocale();

  return (
    <div className="mb-24 last:mb-0">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold">{t(titleKey)}</h3>
        <p className="text-inkmut dark:text-dark-inkmut mt-4 text-[15px] leading-relaxed">
          {t(descKey)}
        </p>
      </div>

      {/* Showcase image — wide UI screenshots (≈2:1) shown full-width at their
          native ratio (downscaled, so crisp) inside a framed card. */}
      <div className="max-w-4xl mx-auto card overflow-hidden shadow-lift">
        <img src={image} alt={imageAlt} loading="lazy" className="block w-full h-auto" />
      </div>

      {/* Feature grid */}
      <div className="max-w-5xl mx-auto mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.titleKey} className="card card-hover p-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                <Check className="h-3 w-3" />
              </span>
              <div>
                <div className="font-semibold text-[14px] leading-snug">{t(f.titleKey)}</div>
                <p className="text-[12.5px] text-inkmut dark:text-dark-inkmut mt-1 leading-relaxed">
                  {t(f.descKey)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/login" className="btn btn-primary inline-flex px-5 py-2.5 text-[15px]">
          {t(ctaKey)}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
