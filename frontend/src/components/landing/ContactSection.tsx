"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function ContactSection() {
  const { t } = useLocale();

  return (
    <section id="lp-contact" className="w-full bg-surface2/60 dark:bg-dark-surface/40">
      <div className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{t("lp_contact_title")}</h2>
          <p className="text-inkmut dark:text-dark-inkmut mt-3 text-[15px] leading-relaxed">
            {t("lp_contact_intro")}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="font-semibold mt-3 text-[14px]">{t("lp_contact_addr_title")}</div>
            <p className="text-[13px] text-inkmut dark:text-dark-inkmut mt-1 leading-relaxed">
              {t("lp_contact_addr_l1")}
              <br />
              {t("lp_contact_addr_l2")}
            </p>
          </div>

          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <Mail className="h-5 w-5" />
            </span>
            <div className="font-semibold mt-3 text-[14px]">{t("lp_contact_email_title")}</div>
            <a
              href={`mailto:${t("lp_contact_email")}`}
              className="text-[13px] text-brand-deep hover:underline mt-1 inline-block break-all"
            >
              {t("lp_contact_email")}
            </a>
          </div>

          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <Phone className="h-5 w-5" />
            </span>
            <div className="font-semibold mt-3 text-[14px]">{t("lp_contact_phone_title")}</div>
            <p className="text-[13px] text-inkmut dark:text-dark-inkmut mt-1">
              {t("lp_contact_phone")}
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <a
            href={`mailto:${t("lp_contact_email")}`}
            className="btn btn-primary inline-flex px-6 py-2.5 text-[15px]"
          >
            <Mail className="h-4 w-4" />
            {t("lp_contact_cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
