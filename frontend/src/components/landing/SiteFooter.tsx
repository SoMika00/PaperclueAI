"use client";

import Link from "next/link";
import { Twitter, Linkedin, Youtube } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";
import PaymentMethods from "@/components/landing/PaymentMethods";

const PLATFORM: { key: DictKey; href: string }[] = [
  { key: "lp_footer_mindmap", href: "/login" },
  { key: "lp_footer_resmirror", href: "/login" },
  { key: "lp_footer_journal", href: "/login" },
  { key: "lp_footer_insight", href: "/login" },
  { key: "lp_footer_pricing", href: "/pricing" },
  { key: "lp_footer_blog", href: "/blog" },
];

const COMPANY: { key: DictKey; href: string }[] = [
  { key: "lp_footer_about", href: "/about-us" },
  { key: "lp_footer_team", href: "/login" },
  { key: "lp_footer_careers", href: "/login" },
  { key: "lp_footer_contact", href: "/#contact" },
];

const LEGAL: { key: DictKey; href: string }[] = [
  { key: "lp_footer_privacy", href: "/privacy" },
  { key: "lp_footer_terms", href: "/terms" },
  { key: "commercialDisclosure_link", href: "/commercial-disclosure" },
  { key: "refundPolicy_link", href: "/refund-policy" },
];

const SOCIAL = [
  { name: "Twitter", Icon: Twitter, url: "https://x.com/PaperclueAI" },
  { name: "LinkedIn", Icon: Linkedin, url: "https://www.linkedin.com/company/paperclue-ai" },
  { name: "YouTube", Icon: Youtube, url: "https://www.youtube.com/channel/UCUBbWjvQIdG5Id1hpjSPRRg" },
];

export default function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src="/paperclue-logo.png" alt="PaperClue" className="h-7 w-auto" />
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-4 leading-relaxed max-w-xs">
              {t("lp_footer_desc")}
            </p>
            <div className="flex gap-2.5 mt-5">
              {SOCIAL.map(({ name, Icon, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-pcblue-light hover:text-pcblue dark:bg-slate-800 dark:text-slate-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-[14px] mb-4">{t("lp_footer_platform")}</h3>
            <ul className="space-y-2.5">
              {PLATFORM.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-[13px] text-slate-600 dark:text-slate-300 transition-colors hover:text-pcblue"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-[14px] mb-4">{t("lp_footer_company")}</h3>
            <ul className="space-y-2.5">
              {COMPANY.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-[13px] text-slate-600 dark:text-slate-300 transition-colors hover:text-pcblue"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold text-[14px] mb-4">{t("landing_login_button")}</h3>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {t("landing_footer_tagline")}
            </p>
            <Link href="/login" className="btn inline-flex px-5 py-2 bg-gradient-to-r from-[#4361ee] to-[#3953af] text-white shadow-sm hover:brightness-110">
              {t("landing_hero_cta")}
            </Link>
          </div>
        </div>

        {/* Supported payment options */}
        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
          <PaymentMethods />
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-slate-600 dark:text-slate-300">{t("lp_footer_copyright")}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map(({ key, href }) => (
              <Link
                key={href}
                href={href}
                className="text-[12.5px] text-slate-600 dark:text-slate-300 transition-colors hover:text-pcblue"
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
