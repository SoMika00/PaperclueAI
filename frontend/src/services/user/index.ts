/* Shim: newsletter subscribe has no backend in this build. Opens a mailto so the
   request still reaches us; return shape matches the original. */
export * from "./api";

export async function registerSubscribe(
  email: string
): Promise<{ success: boolean; message?: string }> {
  if (typeof window !== "undefined") {
    window.location.href = `mailto:contact@paperclue.ai?subject=${encodeURIComponent(
      "Newsletter subscription"
    )}&body=${encodeURIComponent(`Please subscribe: ${email}`)}`;
  }
  return { success: true, message: "Opening your email client…" };
}

/* Auth shims — the marketing pages are public; real auth lives in Supabase. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCurrentUser(): Promise<any> {
  return null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserById(_id: number): Promise<any> {
  return null;
}
export async function logout(): Promise<{ success: boolean }> {
  return { success: true };
}
