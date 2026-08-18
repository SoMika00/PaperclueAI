/* Shim: the marketing pages are always public in this build (auth lives in
   Supabase, not a cookie token), so the ported navbar's logged-in branches stay
   inactive and it renders its public About / Pricing / Blog / Login links. */
export function getAccessToken(): string | undefined {
  return undefined;
}
export function removeAccessToken(): void {
  /* no-op */
}
export function setAccessToken(_token: string): void {
  /* no-op */
}
