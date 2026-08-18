/* Shim for the ported marketing navbar. The original app had a credit/usage API;
   this build has no such backend and the marketing pages are always public, so
   these return empty data and the navbar's credit UI never renders. Types kept
   compatible with the original call sites. */
export interface CreditUsage {
  id?: number;
  created_at?: string;
  credit?: number;
}

export interface CreditUsageListResponse {
  usages: CreditUsage[];
  total_credit?: number;
  used_credit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCreditUsageByUserId(_userId: number): Promise<any> {
  return { success: true, data: { usages: [] } };
}
