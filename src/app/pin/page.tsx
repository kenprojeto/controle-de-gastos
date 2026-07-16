"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { verificarPin } from "@/server/pin";

export default function PaginaPin() {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [verificando, iniciar] = useTransition();

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    iniciar(async () => {
      const r = await verificarPin(pin);
      if (r && !r.ok) {
        setErro(r.erro ?? "PIN incorreto.");
        setPin("");
      }
    });
  }

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <Lock size={28} />
      </span>
      <div className="text-center">
        <h1 className="text-lg font-bold">Controle de Gastos</h1>
        <p className="text-sm text-slate-500">Digite o PIN para entrar</p>
      </div>
      <form onSubmit={entrar} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-center text-2xl tracking-[0.5em] outline-none placeholder:text-slate-600"
        />
        {erro && <p className="text-center text-sm text-rose-400">{erro}</p>}
        <button
          type="submit"
          disabled={verificando || !pin}
          className="rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {verificando ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
