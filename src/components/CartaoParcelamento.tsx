"use client";

import { useTransition } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import BarraProgresso from "@/components/BarraProgresso";
import { useToast } from "@/components/Toast";
import { excluirParcelamento, marcarParcelasPagasAte } from "@/server/parcelamentos";
import { formatarBRL } from "@/lib/dinheiro";
import type { CategoriaResumo } from "@/lib/tipos";

export type ParcelamentoDTO = {
  id: string;
  descricao: string;
  valorParcelaCentavos: number;
  totalParcelas: number;
  categoria: CategoriaResumo;
  parcelaAtual: number;
  restanteCentavos: number;
  parcelasNaoPagas: number;
  concluido: boolean;
  inicioRotulo: string;
  comecaNoFuturo: boolean;
  anoAtual: number;
  mesAtual: number;
};

export default function CartaoParcelamento({
  parcelamento: p,
}: {
  parcelamento: ParcelamentoDTO;
}) {
  const toast = useToast();
  const [ocupado, iniciar] = useTransition();

  function excluir() {
    if (
      !confirm(
        `Excluir "${p.descricao}" e TODAS as suas parcelas (inclusive as já lançadas)?`
      )
    )
      return;
    iniciar(async () => {
      const r = await excluirParcelamento(p.id);
      if (r.ok) toast("Compra parcelada excluída ✓");
      else toast(r.erro ?? "Erro.", "erro");
    });
  }

  function quitarAteAgora() {
    if (!confirm("Marcar como pagas todas as parcelas até o mês atual?")) return;
    iniciar(async () => {
      const r = await marcarParcelasPagasAte(p.id, p.anoAtual, p.mesAtual);
      if (r.ok) toast("Parcelas marcadas como pagas ✓");
      else toast(r.erro ?? "Erro.", "erro");
    });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${p.categoria.cor}26` }}
        >
          {p.categoria.icone}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{p.descricao}</p>
          <p className="text-[11px] text-slate-500">
            {p.totalParcelas}× de {formatarBRL(p.valorParcelaCentavos)} · desde{" "}
            {p.inicioRotulo}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-sky-300">
            {p.comecaNoFuturo ? `0/${p.totalParcelas}` : `${p.parcelaAtual}/${p.totalParcelas}`}
          </p>
          <p className="text-[10px] text-slate-500">parcelas</p>
        </div>
      </div>

      <div className="mt-2.5">
        <BarraProgresso
          fracao={p.parcelaAtual / p.totalParcelas}
          cor={p.concluido ? "#34d399" : "#38bdf8"}
          altura={6}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {p.concluido ? (
            "Concluído"
          ) : (
            <>
              Falta pagar:{" "}
              <span className="font-semibold text-slate-200">
                {formatarBRL(p.restanteCentavos)}
              </span>{" "}
              ({p.parcelasNaoPagas}×)
            </>
          )}
        </p>
        <div className="flex gap-1">
          {!p.concluido && p.parcelasNaoPagas > 0 && !p.comecaNoFuturo && (
            <button
              type="button"
              onClick={quitarAteAgora}
              disabled={ocupado}
              title="Marcar parcelas até o mês atual como pagas"
              className="rounded-full p-2 text-slate-500 hover:text-emerald-400"
            >
              <CheckCheck size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={excluir}
            disabled={ocupado}
            title="Excluir compra parcelada"
            className="rounded-full p-2 text-slate-500 hover:text-rose-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
