"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; mensagem: string; tipo: "sucesso" | "erro" };

const ContextoToast = createContext<(mensagem: string, tipo?: Toast["tipo"]) => void>(
  () => {}
);

export function useToast() {
  return useContext(ContextoToast);
}

export function ProvedorToast({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(1);

  const mostrar = useCallback((mensagem: string, tipo: Toast["tipo"] = "sucesso") => {
    const id = proximoId.current++;
    setToasts((atuais) => [...atuais, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((atuais) => atuais.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ContextoToast.Provider value={mostrar}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animar-aparecer rounded-full px-4 py-2 text-sm font-medium shadow-lg ${
              t.tipo === "sucesso"
                ? "bg-emerald-500 text-emerald-950"
                : "bg-rose-500 text-rose-50"
            }`}
          >
            {t.mensagem}
          </div>
        ))}
      </div>
    </ContextoToast.Provider>
  );
}
