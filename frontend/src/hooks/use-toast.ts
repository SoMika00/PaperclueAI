/* Shim for the ported marketing components. They call the original app's
   toast API — `toast.success({ title, description })` / `.error({...})` — so
   expose that exact shape and forward to sonner (mounted on marketing pages). */
import { toast as sonnerToast } from "sonner";

type ToastArgs = { title?: string; description?: string };

const render = (
  fn: (msg: string, opts?: { description?: string }) => unknown,
  { title, description }: ToastArgs
) => fn(title ?? "", description ? { description } : undefined);

export const toast = {
  success: (args: ToastArgs) => render(sonnerToast.success, args),
  error: (args: ToastArgs) => render(sonnerToast.error, args),
  info: (args: ToastArgs) => render(sonnerToast.info, args),
};

export function useToast() {
  return { toast };
}
