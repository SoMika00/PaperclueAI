"use client";
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import UploadDropzone from "./UploadDropzone";

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 grid place-items-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-xl border border-line shadow-drawer w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold">{t("upload_modal_title")}</h2>
          <button onClick={onClose} className="text-inkmut hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <UploadDropzone />
      </div>
    </div>
  );
}
