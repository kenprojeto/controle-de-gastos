"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

/** Bottom sheet mobile-first para formulários e detalhes. */
export default function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!aberta) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberta]);

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animar-aparecer absolute inset-0 bg-black/60"
        onClick={aoFechar}
      />
      <div className="animar-subir absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-slate-800 bg-slate-900 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{titulo}</h2>
          <button
            onClick={aoFechar}
            className="rounded-full bg-slate-800 p-1.5 text-slate-400"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
