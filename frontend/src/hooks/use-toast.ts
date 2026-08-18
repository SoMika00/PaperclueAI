/* Shim for the ported marketing components. They use BOTH `toast({...})` and
   `toast.success({ title, description })`, so expose a callable with those
   helpers attached, forwarding to sonner (mounted on the marketing pages). */
import { toast as sonnerToast } from "sonner";

type ToastArgs = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

const show = (
  fn: (msg: string, opts?: { description?: string }) => unknown,
  { title, description }: ToastArgs
) => fn(title ?? "", description ? { description } : undefined);

function base(args: ToastArgs) {
  return show(
    args.variant === "destructive" ? sonnerToast.error : sonnerToast,
    args
  );
}

export const toast = Object.assign(base, {
  success: (args: ToastArgs) => show(sonnerToast.success, args),
  error: (args: ToastArgs) => show(sonnerToast.error, args),
  info: (args: ToastArgs) => show(sonnerToast.info, args),
});

export function useToast() {
  return { toast };
}
