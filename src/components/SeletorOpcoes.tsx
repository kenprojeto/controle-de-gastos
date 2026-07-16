"use client";

/** Botões segmentados genéricos (forma de pagamento, responsável etc). */
export default function SeletorOpcoes<T extends string>({
  opcoes,
  valor,
  aoMudar,
  colunas,
}: {
  opcoes: { valor: T; rotulo: string; icone?: string }[];
  valor: T | null;
  aoMudar: (valor: T) => void;
  colunas?: number;
}) {
  const estiloGrid = colunas
    ? { gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }
    : { gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` };

  return (
    <div className="grid gap-1.5" style={estiloGrid}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => aoMudar(o.valor)}
            className={`rounded-xl border px-1 py-2 text-[13px] font-medium transition-colors ${
              ativo
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                : "border-slate-700 bg-slate-800/60 text-slate-300"
            }`}
          >
            {o.icone ? <span className="mr-1">{o.icone}</span> : null}
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
