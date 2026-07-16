"use client";

import { formatarValor } from "@/lib/dinheiro";

/**
 * Campo de valor em reais com máscara de centavos: digitar "1234"
 * vira "12,34". Sempre abre o teclado numérico no celular.
 */
export default function CampoValor({
  centavos,
  aoMudar,
  grande = false,
  autoFoco = false,
  id,
}: {
  centavos: number;
  aoMudar: (centavos: number) => void;
  grande?: boolean;
  autoFoco?: boolean;
  id?: string;
}) {
  function tratarMudanca(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
    aoMudar(digitos ? parseInt(digitos, 10) : 0);
  }

  if (grande) {
    return (
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-xl font-medium text-slate-400">R$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFoco}
          value={centavos ? formatarValor(centavos) : ""}
          onChange={tratarMudanca}
          placeholder="0,00"
          className="w-56 bg-transparent text-center text-5xl font-bold tracking-tight text-slate-50 outline-none placeholder:text-slate-700"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 px-3">
      <span className="text-sm text-slate-400">R$</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFoco}
        value={centavos ? formatarValor(centavos) : ""}
        onChange={tratarMudanca}
        placeholder="0,00"
        className="w-full bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-slate-600"
      />
    </div>
  );
}
