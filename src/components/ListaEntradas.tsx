"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pause, Play } from "lucide-react";
import Folha from "@/components/Folha";
import CampoValor from "@/components/CampoValor";
import SeletorOpcoes from "@/components/SeletorOpcoes";
import { useToast } from "@/components/Toast";
import {
  alternarPausadaEntrada,
  atualizarEntrada,
  criarEntrada,
  excluirEntrada,
} from "@/server/entradas";
import { formatarBRL } from "@/lib/dinheiro";
import { RESPONSAVEIS } from "@/lib/rotulos";
import type { EntradaDTO } from "@/lib/tipos";
import type { Responsavel } from "@/generated/prisma/enums";

export default function ListaEntradas({
  entradas,
  hoje,
  tituloMes,
}: {
  entradas: EntradaDTO[];
  hoje: string;
  tituloMes: string;
}) {
  const [editando, setEditando] = useState<EntradaDTO | null>(null);
  const [criando, setCriando] = useState(false);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Entradas de {tituloMes}
        </h2>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300"
        >
          <Plus size={14} /> Nova
        </button>
      </div>

      {entradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
          Nenhuma entrada neste mês.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entradas.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setEditando(e)}
                className={`flex w-full items-center gap-2.5 rounded-xl bg-slate-900 px-3 py-2.5 text-left ${
                  e.pausada ? "opacity-40" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {e.nome}
                    {e.recorrente && (
                      <span className="ml-1.5 rounded bg-emerald-500/15 px-1 py-0.5 text-[10px] font-semibold text-emerald-300">
                        recorrente
                      </span>
                    )}
                    {e.pausada && (
                      <span className="ml-1.5 rounded bg-slate-700 px-1 py-0.5 text-[10px] font-semibold text-slate-300">
                        pausada
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {e.dataISO.split("-").reverse().slice(0, 2).join("/")} ·{" "}
                    {e.responsavel === "CASAL"
                      ? "Casal"
                      : e.responsavel === "DENNIS"
                        ? "Dennis"
                        : "Patrizzia"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-emerald-400">
                  {formatarBRL(e.valorCentavos)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {(criando || editando) && (
        <FormEntrada
          entrada={editando}
          hoje={hoje}
          aoFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}
    </section>
  );
}

function FormEntrada({
  entrada,
  hoje,
  aoFechar,
}: {
  entrada: EntradaDTO | null;
  hoje: string;
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const [nome, setNome] = useState(entrada?.nome ?? "");
  const [centavos, setCentavos] = useState(entrada?.valorCentavos ?? 0);
  const [dataISO, setDataISO] = useState(entrada?.dataISO ?? hoje);
  const [responsavel, setResponsavel] = useState<Responsavel>(
    entrada?.responsavel ?? "CASAL"
  );

  function salvar() {
    iniciar(async () => {
      const dados = { nome, valorCentavos: centavos, dataISO, responsavel };
      const r = entrada
        ? await atualizarEntrada(entrada.id, dados)
        : await criarEntrada(dados);
      if (r.ok) {
        toast(entrada ? "Entrada atualizada ✓" : "Entrada registrada ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  function excluir() {
    if (!entrada) return;
    const msg = entrada.recorrente
      ? "Esta entrada é recorrente: ela será PAUSADA neste mês (continua nos próximos). Confirmar?"
      : "Excluir esta entrada?";
    if (!confirm(msg)) return;
    iniciar(async () => {
      const r = await excluirEntrada(entrada.id);
      if (r.ok) {
        toast(entrada.recorrente ? "Pausada neste mês ✓" : "Excluída ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro.", "erro");
      }
    });
  }

  function pausarReativar() {
    if (!entrada) return;
    iniciar(async () => {
      const r = await alternarPausadaEntrada(entrada.id);
      if (r.ok) {
        toast(entrada.pausada ? "Reativada ✓" : "Pausada neste mês ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro.", "erro");
      }
    });
  }

  return (
    <Folha aberta aoFechar={aoFechar} titulo={entrada ? "Editar entrada" : "Nova entrada"}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome / origem</span>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Salário Dennis"
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none placeholder:text-slate-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Valor</span>
          <CampoValor centavos={centavos} aoMudar={setCentavos} />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Data</span>
          <input
            type="date"
            value={dataISO}
            onChange={(e) => setDataISO(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">De quem é</span>
          <SeletorOpcoes
            opcoes={RESPONSAVEIS.map((r) => ({ valor: r.valor, rotulo: r.rotulo }))}
            valor={responsavel}
            aoMudar={setResponsavel}
          />
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || centavos <= 0 || !nome.trim()}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>

        {entrada && (
          <div className="flex gap-2">
            {entrada.recorrente && (
              <button
                type="button"
                onClick={pausarReativar}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-700 py-3 text-sm font-medium text-slate-300"
              >
                {entrada.pausada ? <Play size={16} /> : <Pause size={16} />}
                {entrada.pausada ? "Reativar no mês" : "Pausar no mês"}
              </button>
            )}
            <button
              type="button"
              onClick={excluir}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-rose-900 py-3 text-sm font-medium text-rose-400"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        )}
      </div>
    </Folha>
  );
}
