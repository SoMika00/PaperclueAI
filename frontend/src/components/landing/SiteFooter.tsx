"use client";

import Link from "next/link";
import { Twitter, Linkedin, Youtube } from "lucide-react";
import { useLocale, type DictKey } from "@/lib/i18n";

const PLATFORM: DictKey[] = [
  "lp_footer_mindmap",
  "lp_footer_resmirror",
  "lp_footer_journal",
  "lp_footer_insight",
  "lp_footer_pricing",
  "lp_footer_blog",
];

const COMPANY: { key: DictKey; href: string }[] = [
  { key: "lp_footer_about", href: "/login" },
  { key: "lp_footer_team", href: "/login" },
  { key: "lp_footer_careers", href: "/login" },
  { key: "lp_footer_contact", href: "#lp-contact" },
];

const SOCIAL = [
  { name: "Twitter", Icon: Twitter, url: "https://x.com/PaperclueAI" },
  { name: "LinkedIn", Icon: Linkedin, url: "https://www.linkedin.com/company/paperclue-ai" },
  { name: "YouTube", Icon: Youtube, url: "https://www.youtube.com/channel/UCUBbWjvQIdG5Id1hpjSPRRg" },
];

export default function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-line dark:border-dark-line bg-paper dark:bg-dark-surface">
      <div className="max-w-[1400px] mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src="/paperclue-logo.png" alt="PaperClue" className="h-7 w-auto" />
            <p className="text-[13px] text-inkmut dark:text-dark-inkmut mt-4 leading-relaxed max-w-xs">
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-inkmut transition-colors hover:bg-brand-soft hover:text-brand-deep dark:bg-dark-surface2 dark:text-dark-inkmut"
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
              {PLATFORM.map((key) => (
                <li key={key}>
                  <Link
                    href="/login"
                    className="text-[13px] text-inkmut dark:text-dark-inkmut transition-colors hover:text-brand-deep"
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
                  <a
                    href={href}
                    className="text-[13px] text-inkmut dark:text-dark-inkmut transition-colors hover:text-brand-deep"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold text-[14px] mb-4">{t("landing_login_button")}</h3>
            <p className="text-[13px] text-inkmut dark:text-dark-inkmut mb-4 leading-relaxed">
              {t("landing_footer_tagline")}
            </p>
            <Link href="/login" className="btn btn-primary inline-flex px-5 py-2">
              {t("landing_hero_cta")}
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line dark:border-dark-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-inkmut dark:text-dark-inkmut">{t("lp_footer_copyright")}</p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-[12.5px] text-inkmut dark:text-dark-inkmut transition-colors hover:text-brand-deep"
            >
              {t("lp_footer_privacy")}
            </Link>
            <Link
              href="/login"
              className="text-[12.5px] text-inkmut dark:text-dark-inkmut transition-colors hover:text-brand-deep"
            >
              {t("lp_footer_terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
