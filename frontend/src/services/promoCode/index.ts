/* Shim: no promo-code backend in this build (promo codes are handled by Stripe
   Checkout). The ported navbar's promo dialog therefore has nothing to list. */
export interface PromoCode {
  id?: number;
  code?: string;
  discount?: number;
  expires_at?: string;
  is_active?: boolean;
}
export interface PromoCodeListResponse {
  promo_codes: PromoCode[];
}
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
export async function getPromoCodes(): Promise<ApiResponse<PromoCodeListResponse>> {
  return { success: true, data: { promo_codes: [] } };
}
export async function applyPromoCode(_code: string): Promise<ApiResponse<null>> {
  return { success: false, message: "Promo codes are applied at checkout." };
}
export async function createPromoCode(): Promise<ApiResponse<null>> {
  return { success: false, message: "Not available." };
}
