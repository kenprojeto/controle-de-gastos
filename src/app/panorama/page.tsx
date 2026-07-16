import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hojeLocal, nomeMes } from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";

export const dynamic = "force-dynamic";

export default async function PaginaPanorama({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const hoje = hojeLocal();
  const ano = /^\d{4}$/.test(sp.ano ?? "") ? Number(sp.ano) : hoje.ano;

  const [gastosPorMes, entradasPorMes] = await Promise.all([
    prisma.transacao.groupBy({
      by: ["mesRef"],
      where: { anoRef: ano, pausada: false },
      _sum: { valorCentavos: true },
    }),
    prisma.entrada.groupBy({
      by: ["mesRef"],
      where: { anoRef: ano, pausada: false },
      _sum: { valorCentavos: true },
    }),
  ]);

  const gastos = new Map(gastosPorMes.map((g) => [g.mesRef, g._sum.valorCentavos ?? 0]));
  const entradas = new Map(entradasPorMes.map((e) => [e.mesRef, e._sum.valorCentavos ?? 0]));

  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const g = gastos.get(mes) ?? 0;
    const e = entradas.get(mes) ?? 0;
    return { mes, gastos: g, entradas: e, diferenca: e - g };
  });

  const totais = meses.reduce(
    (acc, m) => ({
      gastos: acc.gastos + m.gastos,
      entradas: acc.entradas + m.entradas,
    }),
    { gastos: 0, entradas: 0 }
  );

  const ehFuturo = (mes: number) => ano * 12 + mes > hoje.ano * 12 + hoje.mes;
  const ehAtual = (mes: number) => ano === hoje.ano && mes === hoje.mes;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <Link
          href={`/panorama?ano=${ano - 1}`}
          className="rounded-full bg-slate-900 p-2 text-slate-400"
          aria-label="Ano anterior"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-bold">Panorama {ano}</h1>
          <p className="text-xs text-slate-500">calculado dos lançamentos reais</p>
        </div>
        <Link
          href={`/panorama?ano=${ano + 1}`}
          className="rounded-full bg-slate-900 p-2 text-slate-400"
          aria-label="Próximo ano"
        >
          <ChevronRight size={20} />
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-slate-500">Entradas</p>
            <p className="text-sm font-bold text-emerald-400">
              {formatarBRL(totais.entradas)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Gastos</p>
            <p className="text-sm font-bold text-rose-400">{formatarBRL(totais.gastos)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Diferença</p>
            <p
              className={`text-sm font-bold ${
                totais.entradas - totais.gastos >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatarBRL(totais.entradas - totais.gastos)}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 text-left font-semibold">Mês</th>
              <th className="px-2 py-2.5 text-right font-semibold">Entradas</th>
              <th className="px-2 py-2.5 text-right font-semibold">Gastos</th>
              <th className="px-3 py-2.5 text-right font-semibold">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => {
              const vazio = m.gastos === 0 && m.entradas === 0;
              return (
                <tr
                  key={m.mes}
                  className={`border-t border-slate-800/60 ${
                    ehAtual(m.mes) ? "bg-emerald-500/5" : ""
                  } ${vazio ? "opacity-40" : ""}`}
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/resumo?m=${ano}-${String(m.mes).padStart(2, "0")}`}
                      className="flex items-center gap-1.5"
                    >
                      {nomeMes(m.mes).slice(0, 3)}
                      {ehAtual(m.mes) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                      {ehFuturo(m.mes) && !vazio && (
                        <span className="text-[9px] text-sky-400">prev.</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-right text-emerald-400/90">
                    {m.entradas ? formatarBRL(m.entradas) : "–"}
                  </td>
                  <td className="px-2 py-2 text-right text-rose-400/90">
                    {m.gastos ? formatarBRL(m.gastos) : "–"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      vazio
                        ? "text-slate-600"
                        : m.diferenca >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                    }`}
                  >
                    {vazio ? "–" : formatarBRL(m.diferenca)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-center text-xs text-slate-600">
        Meses futuros mostram o previsto (fixos já gerados + parcelas).
        <br />
        Toque num mês para ver o detalhe.
      </p>
    </div>
  );
}
