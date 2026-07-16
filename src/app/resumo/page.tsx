import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  chaveMes,
  hojeISO,
  hojeLocal,
  mesAnterior,
  nomeMes,
  parseChaveMes,
  proximoMes,
} from "@/lib/datas";
import { formatarBRL } from "@/lib/dinheiro";
import { garantirOcorrenciasDoMes } from "@/lib/recorrencias";
import { FORMAS_PAGAMENTO, RESPONSAVEIS } from "@/lib/rotulos";
import ListaTransacoes from "@/components/ListaTransacoes";
import ListaEntradas from "@/components/ListaEntradas";
import BarraProgresso from "@/components/BarraProgresso";
import type { EntradaDTO, TransacaoDTO } from "@/lib/tipos";
import type { Responsavel } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const RESP_VALIDOS = ["DENNIS", "PATRIZZIA", "CASAL"] as const;

export default async function PaginaResumo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const hoje = hojeLocal();
  const comp = parseChaveMes(sp.m) ?? { ano: hoje.ano, mes: hoje.mes };
  const respFiltro = RESP_VALIDOS.includes(sp.r as Responsavel)
    ? (sp.r as Responsavel)
    : null;
  const catFiltro = sp.c ?? null;
  const formaFiltro = sp.f ?? null;

  await garantirOcorrenciasDoMes(comp.ano, comp.mes);

  const [transacoesDb, entradasDb, categorias] = await Promise.all([
    prisma.transacao.findMany({
      where: {
        anoRef: comp.ano,
        mesRef: comp.mes,
        ...(respFiltro ? { responsavel: respFiltro } : {}),
      },
      include: {
        categoria: { select: { id: true, nome: true, icone: true, cor: true } },
        parcelamento: { select: { totalParcelas: true } },
      },
      orderBy: [{ data: "desc" }, { criadaEm: "desc" }],
    }),
    prisma.entrada.findMany({
      where: {
        anoRef: comp.ano,
        mesRef: comp.mes,
        ...(respFiltro ? { responsavel: respFiltro } : {}),
      },
      orderBy: [{ data: "asc" }],
    }),
    prisma.categoria.findMany({
      where: { ativa: true },
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true, icone: true, cor: true },
    }),
  ]);

  const ativas = transacoesDb.filter((t) => !t.pausada);
  const entradasAtivas = entradasDb.filter((e) => !e.pausada);

  const totalGastos = ativas.reduce((s, t) => s + t.valorCentavos, 0);
  const totalEntradas = entradasAtivas.reduce((s, e) => s + e.valorCentavos, 0);
  const saldo = totalEntradas - totalGastos;

  const porTipo = { FIXO: 0, VARIAVEL: 0, PARCELADO: 0 };
  for (const t of ativas) porTipo[t.tipo] += t.valorCentavos;

  const totalPago = ativas.filter((t) => t.pago).reduce((s, t) => s + t.valorCentavos, 0);
  const totalPendente = totalGastos - totalPago;

  const porCategoria = new Map<string, { cat: (typeof categorias)[0]; total: number }>();
  for (const t of ativas) {
    const atual = porCategoria.get(t.categoria.id);
    if (atual) atual.total += t.valorCentavos;
    else porCategoria.set(t.categoria.id, { cat: t.categoria, total: t.valorCentavos });
  }
  const categoriasOrdenadas = [...porCategoria.values()].sort((a, b) => b.total - a.total);

  const porForma = new Map<string, number>();
  for (const t of ativas) {
    porForma.set(t.formaPagamento, (porForma.get(t.formaPagamento) ?? 0) + t.valorCentavos);
  }

  const anterior = mesAnterior(comp.ano, comp.mes);
  const proximo = proximoMes(comp.ano, comp.mes);
  const ehMesAtual = comp.ano === hoje.ano && comp.mes === hoje.mes;
  const ehFuturo = comp.ano * 12 + comp.mes > hoje.ano * 12 + hoje.mes;

  function urlCom(params: Record<string, string | null>): string {
    const url = new URLSearchParams();
    const base: Record<string, string | null> = {
      m: chaveMes(comp.ano, comp.mes),
      r: respFiltro,
      c: catFiltro,
      f: formaFiltro,
      ...params,
    };
    for (const [k, v] of Object.entries(base)) if (v) url.set(k, v);
    return `/resumo?${url.toString()}`;
  }

  const transacoes: TransacaoDTO[] = transacoesDb
    .filter((t) => !catFiltro || t.categoria.id === catFiltro)
    .filter((t) => !formaFiltro || t.formaPagamento === formaFiltro)
    .map((t) => ({
      id: t.id,
      descricao: t.descricao,
      valorCentavos: t.valorCentavos,
      dataISO: t.data.toISOString().slice(0, 10),
      tipo: t.tipo,
      formaPagamento: t.formaPagamento,
      pago: t.pago,
      pausada: t.pausada,
      responsavel: t.responsavel,
      observacao: t.observacao,
      categoria: t.categoria,
      parcelaNumero: t.parcelaNumero,
      totalParcelas: t.parcelamento?.totalParcelas ?? null,
      ehFixo: t.tipo === "FIXO",
    }));

  const entradas: EntradaDTO[] = entradasDb.map((e) => ({
    id: e.id,
    nome: e.nome,
    valorCentavos: e.valorCentavos,
    dataISO: e.data.toISOString().slice(0, 10),
    responsavel: e.responsavel,
    recorrente: e.receitaRecorrenteId !== null,
    pausada: e.pausada,
  }));

  const filtrosDaLista =
    (catFiltro ? 1 : 0) + (formaFiltro ? 1 : 0) > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Navegação de mês */}
      <header className="flex items-center justify-between">
        <Link
          href={`/resumo?${new URLSearchParams({ m: chaveMes(anterior.ano, anterior.mes), ...(respFiltro ? { r: respFiltro } : {}) })}`}
          className="rounded-full bg-slate-900 p-2 text-slate-400"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-bold">
            {nomeMes(comp.mes)} {comp.ano}
          </h1>
          {ehMesAtual && <p className="text-[11px] text-emerald-400">mês atual</p>}
          {ehFuturo && <p className="text-[11px] text-sky-400">previsto</p>}
        </div>
        <Link
          href={`/resumo?${new URLSearchParams({ m: chaveMes(proximo.ano, proximo.mes), ...(respFiltro ? { r: respFiltro } : {}) })}`}
          className="rounded-full bg-slate-900 p-2 text-slate-400"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} />
        </Link>
      </header>

      {/* Filtro por responsável */}
      <div className="flex gap-1.5">
        <Link
          href={urlCom({ r: null })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            !respFiltro ? "bg-emerald-500 text-emerald-950" : "bg-slate-900 text-slate-400"
          }`}
        >
          Todos
        </Link>
        {RESPONSAVEIS.map((r) => (
          <Link
            key={r.valor}
            href={urlCom({ r: r.valor })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              respFiltro === r.valor
                ? "bg-emerald-500 text-emerald-950"
                : "bg-slate-900 text-slate-400"
            }`}
          >
            {r.rotulo}
          </Link>
        ))}
      </div>

      {/* Saldo */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs text-slate-400">Saldo do mês</p>
        <p
          className={`text-3xl font-bold tracking-tight ${
            saldo >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {formatarBRL(saldo)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Entradas</p>
            <p className="font-semibold text-emerald-400">{formatarBRL(totalEntradas)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Gastos</p>
            <p className="font-semibold text-rose-400">{formatarBRL(totalGastos)}</p>
          </div>
        </div>
      </section>

      {/* Por tipo */}
      <section className="grid grid-cols-3 gap-2">
        {(
          [
            ["Fixos", porTipo.FIXO],
            ["Variáveis", porTipo.VARIAVEL],
            ["Parcelas", porTipo.PARCELADO],
          ] as const
        ).map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p className="text-[11px] text-slate-500">{rotulo}</p>
            <p className="text-sm font-semibold">{formatarBRL(valor)}</p>
          </div>
        ))}
      </section>

      {/* Pago vs pendente */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Pago: <span className="font-semibold text-slate-100">{formatarBRL(totalPago)}</span>
          </span>
          <span className="text-slate-400">
            Falta:{" "}
            <span className="font-semibold text-amber-400">{formatarBRL(totalPendente)}</span>
          </span>
        </div>
        <BarraProgresso fracao={totalGastos > 0 ? totalPago / totalGastos : 0} />
      </section>

      {/* Por categoria */}
      {categoriasOrdenadas.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Gastos por categoria
          </h2>
          <div className="flex flex-col gap-1">
            {categoriasOrdenadas.map(({ cat, total }) => {
              const pct = totalGastos > 0 ? (total / totalGastos) * 100 : 0;
              const ativa = catFiltro === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={urlCom({ c: ativa ? null : cat.id })}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                    ativa ? "bg-emerald-500/10 ring-1 ring-emerald-500/50" : "bg-slate-900"
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: `${cat.cor}26` }}
                  >
                    {cat.icone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{cat.nome}</span>
                      <span className="ml-2 shrink-0 font-semibold">{formatarBRL(total)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <BarraProgresso fracao={pct / 100} cor={cat.cor} altura={5} />
                      <span className="w-9 shrink-0 text-right text-[11px] text-slate-500">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Por forma de pagamento */}
      {porForma.size > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Por forma de pagamento
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {FORMAS_PAGAMENTO.filter((f) => porForma.has(f.valor)).map((f) => {
              const ativa = formaFiltro === f.valor;
              return (
                <Link
                  key={f.valor}
                  href={urlCom({ f: ativa ? null : f.valor })}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                    ativa
                      ? "bg-emerald-500/10 ring-1 ring-emerald-500/50"
                      : "border border-slate-800 bg-slate-900"
                  }`}
                >
                  <span className="text-slate-400">
                    {f.icone} {f.rotulo}
                  </span>
                  <span className="font-semibold">{formatarBRL(porForma.get(f.valor)!)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Entradas */}
      <ListaEntradas
        entradas={entradas}
        hoje={hojeISO()}
        tituloMes={`${nomeMes(comp.mes)} ${comp.ano}`}
      />

      {/* Lançamentos */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lançamentos ({transacoes.length})
          </h2>
          {filtrosDaLista && (
            <Link href={urlCom({ c: null, f: null })} className="text-xs text-emerald-400">
              Limpar filtros
            </Link>
          )}
        </div>
        <ListaTransacoes transacoes={transacoes} categorias={categorias} />
      </section>
    </div>
  );
}
