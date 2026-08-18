"use client";
/* "Get in Touch" — recreated from the original contact-section.tsx: contact
   details (address, email, phone) on one side, a message form on the other.
   This is a login-only app with no contact backend, so the form composes a
   mailto: to the contact address on submit. */
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function ContactSection() {
  const { t } = useLocale();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const email = t("lp_contact_email");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      form.subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pcblue";
  const labelClass = "block text-[13px] font-medium mb-1.5";

  return (
    <section id="lp-contact" className="w-full bg-slate-100/60 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <h2 className="font-inter text-2xl sm:text-3xl font-semibold text-center mb-12">
          {t("lp_contact_title")}
        </h2>

        <div className="grid gap-10 md:grid-cols-2 max-w-5xl mx-auto">
          {/* Contact details */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-pcblue-light text-pcblue dark:bg-pcblue/15">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-[15px]">{t("lp_contact_addr_title")}</div>
                <p className="text-[14px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {t("lp_contact_addr_l1")}
                  <br />
                  {t("lp_contact_addr_l2")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-pcblue-light text-pcblue dark:bg-pcblue/15">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-[15px]">{t("lp_contact_email_title")}</div>
                <a
                  href={`mailto:${email}`}
                  className="text-[14px] text-pcblue hover:underline mt-1 inline-block break-all"
                >
                  {email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-pcblue-light text-pcblue dark:bg-pcblue/15">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-[15px]">{t("lp_contact_phone_title")}</div>
                <p className="text-[14px] text-slate-600 dark:text-slate-300 mt-1">
                  {t("lp_contact_phone")}
                </p>
              </div>
            </div>
          </div>

          {/* Message form */}
          <div className="card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="c-name" className={labelClass}>{t("lp_contact_form_name")}</label>
                <input id="c-name" type="text" required value={form.name} onChange={set("name")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="c-email" className={labelClass}>{t("lp_contact_form_email")}</label>
                <input id="c-email" type="email" required value={form.email} onChange={set("email")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="c-subject" className={labelClass}>{t("lp_contact_form_subject")}</label>
                <input id="c-subject" type="text" required value={form.subject} onChange={set("subject")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="c-message" className={labelClass}>{t("lp_contact_form_message")}</label>
                <textarea id="c-message" required rows={4} value={form.message} onChange={set("message")} className={inputClass} />
              </div>
              <button type="submit" className="btn w-full justify-center bg-gradient-to-r from-[#4361ee] to-[#3953af] text-white shadow-sm hover:brightness-110">
                <Mail className="h-4 w-4" />
                {t("lp_contact_form_submit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
