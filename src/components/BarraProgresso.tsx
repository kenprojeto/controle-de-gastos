export default function BarraProgresso({
  fracao,
  cor = "#34d399",
  altura = 8,
}: {
  /** 0 a 1 (valores acima de 1 são truncados) */
  fracao: number;
  cor?: string;
  altura?: number;
}) {
  const pct = Math.max(0, Math.min(1, fracao)) * 100;
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-slate-800"
      style={{ height: altura }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: cor }}
      />
    </div>
  );
}
