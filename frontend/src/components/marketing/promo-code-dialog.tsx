"use client";
/* Stub: the original navbar opened a promo-code dialog for LOGGED-IN users
   against a promo backend that does not exist in this build (promo codes are
   applied on Stripe Checkout instead). The marketing pages are always public,
   so this never renders — it exists only so the ported navbar's import
   resolves and its markup stays verbatim. */
export function PromoCodeDialog(_props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: unknown;
}) {
  return null;
}

export default PromoCodeDialog;
