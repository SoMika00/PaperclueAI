"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";
import LazyVideo from "@/components/landing/LazyVideo";

interface FeatureBlockProps {
  titleKey: DictKey;
  descKey: DictKey;
  features: { titleKey: DictKey; descKey: DictKey }[];
  ctaKey: DictKey;
  image?: string;
  video?: string; // autoplay/muted/loop demo video (Cloudinary) — replaces image
  imageAlt: string;
  reversed?: boolean; // when true, media sits on the right
}

export default function FeatureBlock({
  titleKey,
  descKey,
  features,
  ctaKey,
  image,
  video,
  imageAlt,
  reversed,
}: FeatureBlockProps) {
  const { t } = useLocale();

  return (
    <div className="mb-24 last:mb-0">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold">{t(titleKey)}</h3>
        <p className="text-inkmut dark:text-dark-inkmut mt-4 text-[15px] leading-relaxed">
          {t(descKey)}
        </p>
      </div>

      {/* Media on one side, functionality detail boxes on the other */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className={reversed ? "lg:order-2" : ""}>
          <div className="card overflow-hidden shadow-lift p-2">
            {video ? (
              <LazyVideo src={video} poster={image} alt={imageAlt} />
            ) : (
              <img src={image} alt={imageAlt} loading="lazy" className="block w-full h-auto rounded-lg" />
            )}
          </div>
        </div>

        <div className={`grid gap-3 sm:grid-cols-2 ${reversed ? "lg:order-1" : ""}`}>
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

      <div className="text-center mt-10">
        <Link href="/login" className="btn btn-primary inline-flex px-5 py-2.5 text-[15px]">
          {t(ctaKey)}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
