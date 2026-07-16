"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Folha from "@/components/Folha";
import CampoValor from "@/components/CampoValor";
import { useToast } from "@/components/Toast";
import { excluirInvestimento, salvarInvestimento } from "@/server/investimentos";
import { formatarBRL } from "@/lib/dinheiro";
import { NOMES_MESES } from "@/lib/datas";

export type InvestimentoDTO = {
  id: string;
  ano: number;
  mes: number;
  reservaCentavos: number;
  rendaFixaCentavos: number;
  rendaVariavelCentavos: number;
};

export default function GerenciarInvestimentos({
  investimentos,
  anoAtual,
  mesAtual,
}: {
  investimentos: InvestimentoDTO[];
  anoAtual: number;
  mesAtual: number;
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [editando, setEditando] = useState<InvestimentoDTO | null>(null);
  const [criando, setCriando] = useState(false);

  function excluir(inv: InvestimentoDTO) {
    if (!confirm(`Excluir o registro de ${NOMES_MESES[inv.mes - 1]}/${inv.ano}?`)) return;
    iniciar(async () => {
      const r = await excluirInvestimento(inv.id);
      if (r.ok) toast("Registro excluído ✓");
      else toast(r.erro ?? "Erro.", "erro");
    });
  }

  return (
    <>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Registros mensais
          </h2>
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300"
          >
            <Plus size={14} /> Registrar mês
          </button>
        </div>

        {investimentos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            Nenhum registro ainda. Registre quanto investiram neste mês.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {investimentos.map((inv) => {
              const total =
                inv.reservaCentavos + inv.rendaFixaCentavos + inv.rendaVariavelCentavos;
              return (
                <li
                  key={inv.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {NOMES_MESES[inv.mes - 1]} {inv.ano}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="mr-1 text-sm font-bold text-emerald-400">
                        {formatarBRL(total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditando(inv)}
                        className="rounded-full p-1.5 text-slate-500 hover:text-slate-200"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(inv)}
                        className="rounded-full p-1.5 text-slate-500 hover:text-rose-400"
                        aria-label="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs text-slate-400">
                    <span>Reserva: {formatarBRL(inv.reservaCentavos)}</span>
                    <span>RF: {formatarBRL(inv.rendaFixaCentavos)}</span>
                    <span>RV: {formatarBRL(inv.rendaVariavelCentavos)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(criando || editando) && (
        <FormInvestimento
          investimento={editando}
          anoAtual={anoAtual}
          mesAtual={mesAtual}
          aoFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}
    </>
  );
}

function FormInvestimento({
  investimento,
  anoAtual,
  mesAtual,
  aoFechar,
}: {
  investimento: InvestimentoDTO | null;
  anoAtual: number;
  mesAtual: number;
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const [ano, setAno] = useState(String(investimento?.ano ?? anoAtual));
  const [mes, setMes] = useState(String(investimento?.mes ?? mesAtual));
  const [reserva, setReserva] = useState(investimento?.reservaCentavos ?? 0);
  const [rendaFixa, setRendaFixa] = useState(investimento?.rendaFixaCentavos ?? 0);
  const [rendaVariavel, setRendaVariavel] = useState(
    investimento?.rendaVariavelCentavos ?? 0
  );

  const total = reserva + rendaFixa + rendaVariavel;

  function salvar() {
    iniciar(async () => {
      const r = await salvarInvestimento({
        ano: parseInt(ano, 10),
        mes: parseInt(mes, 10),
        reservaCentavos: reserva,
        rendaFixaCentavos: rendaFixa,
        rendaVariavelCentavos: rendaVariavel,
      });
      if (r.ok) {
        toast("Investimentos salvos ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo={investimento ? "Editar investimentos do mês" : "Registrar investimentos"}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Mês</span>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              disabled={!!investimento}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none disabled:opacity-50"
            >
              {NOMES_MESES.map((n, i) => (
                <option key={n} value={i + 1}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Ano</span>
            <input
              type="number"
              inputMode="numeric"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              disabled={!!investimento}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none disabled:opacity-50"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Reserva de emergência</span>
          <CampoValor centavos={reserva} aoMudar={setReserva} />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Renda fixa</span>
          <CampoValor centavos={rendaFixa} aoMudar={setRendaFixa} />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Renda variável</span>
          <CampoValor centavos={rendaVariavel} aoMudar={setRendaVariavel} />
        </label>

        <p className="text-right text-sm text-slate-400">
          Total do mês: <strong className="text-emerald-400">{formatarBRL(total)}</strong>
        </p>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Folha>
  );
}
