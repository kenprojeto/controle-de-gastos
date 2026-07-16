"use client";

import type { CategoriaResumo } from "@/lib/tipos";

/** Grade de categorias em botões grandes — o caminho mais rápido no toque. */
export default function SeletorCategorias({
  categorias,
  valor,
  aoMudar,
}: {
  categorias: CategoriaResumo[];
  valor: string | null;
  aoMudar: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {categorias.map((c) => {
        const ativa = c.id === valor;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => aoMudar(c.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors ${
              ativa
                ? "border-emerald-500 bg-emerald-500/15"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${c.cor}26` }}
            >
              {c.icone}
            </span>
            <span
              className={`w-full truncate text-center text-[10px] leading-tight ${
                ativa ? "text-emerald-300" : "text-slate-400"
              }`}
            >
              {c.nome}
            </span>
          </button>
        );
      })}
    </div>
  );
}
