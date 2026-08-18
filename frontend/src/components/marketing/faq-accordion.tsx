"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTranslation } from "react-i18next"

export function FaqAccordion() {
  const { t } = useTranslation()

  const faqItems = [
    {
      question: t("home.faq.question1"),
      answer: t("home.faq.answer1"),
    },
    {
      question: t("home.faq.question2"),
      answer: t("home.faq.answer2"),
    },
    {
      question: t("home.faq.question3"),
      answer: t("home.faq.answer3"),
    },
    {
      question: t("home.faq.question4"),
      answer: t("home.faq.answer4"),
    },
    {
      question: t("home.faq.question5"),
      answer: t("home.faq.answer5"),
    },
    {
      question: t("home.faq.question6"),
      answer: t("home.faq.answer6"),
    },
    {
      question: t("home.faq.question7"),
      answer: t("home.faq.answer7"),
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="space-y-4">
        {faqItems.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-all duration-300">
              <h3 className="text-lg font-semibold text-left text-blue-800 dark:text-blue-200">{faq.question}</h3>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 bg-white dark:bg-slate-800">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

