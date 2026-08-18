import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { useState } from "react";
import { toast } from "sonner";
import { submitContactForm } from "@/services/contact/api";
import { ContactFormData } from "@/services/contact/types";

export function ContactSection() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        toast.success(result.message);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        toast.error(result.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-16 bg-gradient-to-r from-blue-50/80 to-violet-50/80 dark:from-black dark:to-black backdrop-blur-sm"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
          {t("home.contact.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-theme_primary flex items-center justify-center">
                <FaMapMarkerAlt className="text-theme_primary dark:text-gray-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  {t("home.contact.address.title")}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t("home.contact.address.line1")}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {t("home.contact.address.line2")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-theme_primary flex items-center justify-center">
                <FaEnvelope className="text-theme_primary dark:text-gray-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  {t("home.contact.email.title")}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t("home.contact.email.address")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-theme_primary flex items-center justify-center">
                <FaPhone className="text-theme_primary dark:text-gray-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  {t("home.contact.phone.title")}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  070-9315-6622
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  {t("home.contact.form.name")}
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input" 
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  {t("home.contact.form.email")}
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input" 
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  {t("home.contact.form.subject")}
                </label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="form-input" 
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  {t("home.contact.form.message")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="form-input"
                ></textarea>
              </div>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-theme_primary to-theme_secondary hover:from-theme_secondary hover:to-theme_primary disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : t("home.contact.form.submit")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
