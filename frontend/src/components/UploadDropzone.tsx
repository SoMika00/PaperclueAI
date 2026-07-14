"use client";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { upload } from "@/lib/api";

export default function UploadDropzone({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are supported.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const ms = await upload(file);
        router.push(`/manuscripts/${ms.id}/overview`);
      } catch (e: any) {
        setError(e.message?.slice(0, 160) || "Upload failed");
        setBusy(false);
      }
    },
    [router]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) send(f);
      }}
      onClick={() => !busy && inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all
        ${drag ? "border-brand-deep bg-brand-soft scale-[1.01]" : "border-ink/15 bg-paper hover:border-brand hover:bg-brand-soft/40"}
        ${compact ? "p-6" : "p-12"} flex flex-col items-center gap-3 text-center`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) send(f);
        }}
      />
      {busy ? (
        <Loader2 className="h-8 w-8 animate-spin text-brand-deep" />
      ) : (
        <FileUp className={`${compact ? "h-7 w-7" : "h-10 w-10"} text-brand-deep`} />
      )}
      <div>
        <div className="font-serif text-ink text-lg">
          {busy ? "Uploading manuscript…" : "Drop your manuscript PDF"}
        </div>
        {!compact && (
          <div className="text-sm text-inkmut mt-1">
            We parse the structure, extract references and index it privately — you
            watch every step.
          </div>
        )}
      </div>
      {error && <div className="text-sm text-danger">{error}</div>}
    </div>
  );
}
