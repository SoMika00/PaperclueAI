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
  reversed?: boolean;
}

export default function FeatureBlock({
  titleKey,
  descKey,
  features,
  ctaKey,
  image,
  imageAlt,
  reversed = false,
}: FeatureBlockProps) {
  const { t } = useLocale();

  return (
    <div className="mb-20 last:mb-0">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold">{t(titleKey)}</h3>
        <p className="text-inkmut dark:text-dark-inkmut mt-4 text-[15px] leading-relaxed">
          {t(descKey)}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Showcase image — framed and contained so screenshots never upscale
            past their native size or crop awkwardly. */}
        <div className={`lg:col-span-5 ${reversed ? "lg:order-2" : ""}`}>
          <div className="card overflow-hidden bg-surface2/60 dark:bg-dark-surface2/40 p-2">
            <img
              src={image}
              alt={imageAlt}
              loading="lazy"
              className="mx-auto w-full max-h-[300px] rounded-md object-contain"
            />
          </div>
        </div>

        {/* Feature grid */}
        <div className={`lg:col-span-7 ${reversed ? "lg:order-1" : ""}`}>
          <div className="grid sm:grid-cols-2 gap-4">
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
        </div>
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
