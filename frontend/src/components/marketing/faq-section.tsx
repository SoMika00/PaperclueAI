import { useTranslation } from "react-i18next";
import { FaqAccordion } from "./faq-accordion";

export function FaqSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
          {t("home.faq.title")}
        </h2>
        <FaqAccordion />
      </div>
    </section>
  );
} 