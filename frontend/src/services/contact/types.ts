/* Shim for the ported marketing contact form. The original app posted to a
   contact API; this build has no contact backend, so the form composes a
   mailto: instead (see ./api). Type kept identical to the original. */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
