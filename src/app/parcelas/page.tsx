import { prisma } from "@/lib/prisma";
import { compararCompetencia, hojeLocal, nomeMes, nomeMesCurto } from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";
import BarraProgresso from "@/components/BarraProgresso";
import CartaoParcelamento, {
  type ParcelamentoDTO,
} from "@/components/CartaoParcelamento";

export const dynamic = "force-dynamic";

export default async function PaginaParcelas() {
  const hoje = hojeLocal();

  const [parcelamentos, parcelasFuturas] = await Promise.all([
    prisma.parcelamento.findMany({
      include: {
        categoria: { select: { id: true, nome: true, icone: true, cor: true } },
        parcelas: {
          select: { anoRef: true, mesRef: true, pago: true, valorCentavos: true },
          orderBy: [{ anoRef: "asc" }, { mesRef: "asc" }],
        },
      },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.transacao.findMany({
      where: {
        tipo: "PARCELADO",
        OR: [
          { anoRef: { gt: hoje.ano } },
          { anoRef: hoje.ano, mesRef: { gt: hoje.mes } },
        ],
      },
      select: { anoRef: true, mesRef: true, valorCentavos: true },
    }),
  ]);

  const dtos: ParcelamentoDTO[] = parcelamentos.map((p) => {
    const passadasOuAtual = p.parcelas.filter(
      (x) => compararCompetencia(x.anoRef, x.mesRef, hoje.ano, hoje.mes) <= 0
    );
    const naoPagas = p.parcelas.filter((x) => !x.pago);
    const parcelaAtual = Math.min(passadasOuAtual.length, p.totalParcelas);
    const concluido =
      p.parcelas.length > 0 &&
      compararCompetencia(
        p.parcelas[p.parcelas.length - 1].anoRef,
        p.parcelas[p.parcelas.length - 1].mesRef,
        hoje.ano,
        hoje.mes
      ) < 0;
    const comecaNoFuturo =
      compararCompetencia(p.primeiraAno, p.primeiraMes, hoje.ano, hoje.mes) > 0;

    return {
      id: p.id,
      descricao: p.descricao,
      valorParcelaCentavos: p.valorParcelaCentavos,
      totalParcelas: p.totalParcelas,
      categoria: p.categoria,
      parcelaAtual,
      restanteCentavos: naoPagas.reduce((s, x) => s + x.valorCentavos, 0),
      parcelasNaoPagas: naoPagas.length,
      concluido,
      inicioRotulo: `${nomeMesCurto(p.primeiraMes)}/${p.primeiraAno}`,
      comecaNoFuturo,
      anoAtual: hoje.ano,
      mesAtual: hoje.mes,
    };
  });

  const ativos = dtos.filter((d) => !d.concluido);
  const concluidos = dtos.filter((d) => d.concluido);

  // Projeção: total de parcelas por mês futuro (próximos 12 meses com dados)
  const porMes = new Map<string, { ano: number; mes: number; total: number }>();
  for (const p of parcelasFuturas) {
    const chave = `${p.anoRef}-${p.mesRef}`;
    const atual = porMes.get(chave);
    if (atual) atual.total += p.valorCentavos;
    else porMes.set(chave, { ano: p.anoRef, mes: p.mesRef, total: p.valorCentavos });
  }
  const projecao = [...porMes.values()]
    .sort((a, b) => compararCompetencia(a.ano, a.mes, b.ano, b.mes))
    .slice(0, 12);
  const maxProjecao = Math.max(...projecao.map((x) => x.total), 1);
  const totalComprometido = [...porMes.values()].reduce((s, x) => s + x.total, 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold">Parcelas</h1>
        <p className="text-xs text-slate-500">Compromissos futuros do casal</p>
      </header>

      {projecao.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Comprometido nos próximos meses</p>
          <p className="mb-3 text-2xl font-bold text-sky-400">
            {formatarBRL(totalComprometido)}
          </p>
          <div className="flex flex-col gap-2">
            {projecao.map((x) => (
              <div key={`${x.ano}-${x.mes}`} className="flex items-center gap-2 text-sm">
                <span className="w-16 shrink-0 text-xs text-slate-400">
                  {nomeMesCurto(x.mes)}/{String(x.ano).slice(2)}
                </span>
                <BarraProgresso fracao={x.total / maxProjecao} cor="#38bdf8" altura={7} />
                <span className="w-24 shrink-0 text-right text-xs font-semibold">
                  {formatarBRL(x.total)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Em andamento ({ativos.length})
        </h2>
        {ativos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            Nenhuma compra parcelada em andamento. 🎉
            <br />
            <span className="text-xs">
              Registre uma pelo botão “Lançar” marcando “É parcelado”.
            </span>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {ativos.map((d) => (
              <CartaoParcelamento key={d.id} parcelamento={d} />
            ))}
          </div>
        )}
      </section>

      {concluidos.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Concluídos ({concluidos.length})
          </h2>
          <div className="flex flex-col gap-2 opacity-60">
            {concluidos.map((d) => (
              <CartaoParcelamento key={d.id} parcelamento={d} />
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-slate-600">
        Hoje: {nomeMes(hoje.mes)} de {hoje.ano}
      </p>
    </div>
  );
}
