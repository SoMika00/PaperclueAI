"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import { useState } from "react";
import { registerSubscribe } from "@/services/user";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "../ui/loading";
import PaymentMethods from "../etc/PaymentMethods";

export function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    const response = await registerSubscribe(email);
    if (response.success) {
      setIsLoading(false);
      toast.success({
        title: t("home.footer.subscribe.success"),
        description: t("home.footer.subscribe.successDescription"),
      });
    } else {
      setIsLoading(false);
      toast.error({
        title: t("home.footer.subscribe.error"),
        description: t("home.footer.subscribe.errorDescription"),
      });
    }
  };

  return (
    <footer className="bg-white/90 dark:bg-slate-900/90 border-t dark:border-slate-800 py-12 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col justify-between items-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold bg-gradient-to-r from-theme_primary to-theme_secondary bg-clip-text text-transparent">
                  Paper Clue AI
                </span>
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {t("home.footer.description")}
              </p>
              {/* <div className="flex flex-row flex-wrap space-x-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("home.footer.address")}:</p>
                <div className="flex flex-col">
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 mb-2">7-45 Saijoasahimachi, Higashihiroshima, Hiroshima 739-0012</p>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 mb-4">〒739-0012 広島県東広島市西条朝日町7-45</p>
                </div>
              </div> */}
              <div className="flex space-x-4">
                {[
                  {
                    name: "Twitter",
                    icon: <FaTwitter size={20} />,
                    url: "https://x.com/PaperclueAI",
                  },
                  {
                    name: "LinkedIn",
                    icon: <FaLinkedin size={20} />,
                    url: "https://www.linkedin.com/company/paperclue-ai",
                  },
                  {
                    name: "Youtube",
                    icon: <FaYoutube size={20} />,
                    url: "https://www.youtube.com/channel/UCUBbWjvQIdG5Id1hpjSPRRg",
                  },
                  {
                    name: "PR times",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="4" fill="#1D2088" />
                        <text
                          x="50%"
                          y="55%"
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontFamily="Arial"
                          fontWeight="bold"
                          dy=".3em"
                        >
                          PR
                        </text>
                      </svg>
                    ),
                    url: "https://prtimes.jp/main/html/searchrlp/company_id/167480",
                  },
                ].map((social) => (
                  <a
                    href={social.url}
                    key={social.name}
                    className="text-slate-500 hover:text-theme_primary transition-colors dark:text-slate-400 dark:hover:text-theme_primary"
                    aria-label={social.name}
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      {social.icon}
                    </div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 dark:text-white">
                {t("home.footer.platform")}
              </h3>
              <ul className="space-y-2">
                {[
                  { name: "resMirror", url: "/proofreader" },
                  { name: "mindMap", url: "/mind-map" },
                  { name: "paperInsight", url: "/paper-insights" },
                  { name: "journalFormatting", url: "/journal-formatting" },
                  // { name: "chromeExtension", url: "#chrome-extension" },
                  { name: "pricing", url: "/pricing" },
                  { name: "blog", url: "/blog" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={`${item.url}`}
                      className="text-sm text-slate-600 hover:text-theme_primary transition-colors dark:text-slate-400 dark:hover:text-theme_primary"
                    >
                      {t(`home.footer.platformItems.${item.name}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 dark:text-white">
                {t("home.footer.company")}
              </h3>
              <ul className="space-y-2">
                {[
                  { name: "about", url: "/about-us" },
                  { name: "team", url: "/team" },
                  { name: "careers", url: "/careers" },
                  { name: "contact", url: "/#contact" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={`${item.url}`}
                      className="text-sm text-slate-600 hover:text-theme_primary transition-colors dark:text-slate-400 dark:hover:text-theme_primary"
                    >
                      {t(`home.footer.companyItems.${item.name}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 dark:text-white">
                {t("home.footer.subscribe.title")}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {t("home.footer.subscribe.description")}
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder={t("home.footer.subscribe.placeholder")}
                  className="flex-1 rounded-l-md border border-r-0 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-theme_primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  className="rounded-l-none bg-gradient-to-r from-theme_primary to-theme_secondary"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? <Loading /> : t("home.footer.subscribe.button")}
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full">
            <PaymentMethods/>
          </div>
        </div>
        <div className="border-t dark:border-slate-800 mt-2 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("home.footer.copyright")}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="privacy"
              className="text-sm text-slate-500 hover:text-theme_primary transition-colors dark:text-slate-400 dark:hover:text-theme_primary"
            >
              {t("home.footer.privacy")}
            </a>
            <a
              href="/term-service"
              className="text-sm text-slate-500 hover:text-theme_primary transition-colors dark:text-slate-400 dark:hover:text-theme_primary"
            >
              {t("home.footer.terms")}
            </a>
            <Link
              href="/commercial-disclosure"
              className="text-sm text-slate-500 hover:text-theme_primary transition-colors dark:text-slate-400 dark:hover:text-theme_primary"
            >
              {t("commercialDisclosure.linkText")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
