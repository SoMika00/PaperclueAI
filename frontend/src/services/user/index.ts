/* Shim: newsletter subscribe has no backend in this build. Opens a mailto so
   the request still reaches us; return shape matches the original. */
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
