/* Shim: no contact backend in this build — open the user's mail client with the
   message pre-filled, matching the original function's return shape. */
import type { ContactFormData } from "./types";

const CONTACT_EMAIL = "contact@paperclue.ai";

export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; message: string }> {
  const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
  if (typeof window !== "undefined") {
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      data.subject
    )}&body=${encodeURIComponent(body)}`;
  }
  return { success: true, message: "Opening your email client…" };
}
