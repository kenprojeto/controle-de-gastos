import { prisma } from "@/lib/prisma";
import { hojeLocal } from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";
import GerenciarInvestimentos from "@/components/GerenciarInvestimentos";

export const dynamic = "force-dynamic";

export default async function PaginaInvestimentos() {
  const hoje = hojeLocal();

  const investimentos = await prisma.investimento.findMany({
    orderBy: [{ anoRef: "desc" }, { mesRef: "desc" }],
  });

  const acumulado = investimentos.reduce(
    (acc, i) => ({
      reserva: acc.reserva + i.reservaCentavos,
      rendaFixa: acc.rendaFixa + i.rendaFixaCentavos,
      rendaVariavel: acc.rendaVariavel + i.rendaVariavelCentavos,
    }),
    { reserva: 0, rendaFixa: 0, rendaVariavel: 0 }
  );
  const totalAcumulado = acumulado.reserva + acumulado.rendaFixa + acumulado.rendaVariavel;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold">Investimentos</h1>
        <p className="text-xs text-slate-500">Quanto o casal investiu em cada mês</p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs text-slate-400">Total investido (acumulado)</p>
        <p className="text-3xl font-bold tracking-tight text-emerald-400">
          {formatarBRL(totalAcumulado)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-[11px] text-slate-500">Reserva</p>
            <p className="font-semibold">{formatarBRL(acumulado.reserva)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Renda fixa</p>
            <p className="font-semibold">{formatarBRL(acumulado.rendaFixa)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Renda variável</p>
            <p className="font-semibold">{formatarBRL(acumulado.rendaVariavel)}</p>
          </div>
        </div>
      </section>

      <GerenciarInvestimentos
        investimentos={investimentos.map((i) => ({
          id: i.id,
          ano: i.anoRef,
          mes: i.mesRef,
          reservaCentavos: i.reservaCentavos,
          rendaFixaCentavos: i.rendaFixaCentavos,
          rendaVariavelCentavos: i.rendaVariavelCentavos,
        }))}
        anoAtual={hoje.ano}
        mesAtual={hoje.mes}
      />
    </div>
  );
}
