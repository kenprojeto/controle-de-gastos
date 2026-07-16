"use client";

import { useState, useTransition } from "react";
import { CalendarClock, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import Folha from "@/components/Folha";
import CampoValor from "@/components/CampoValor";
import BarraProgresso from "@/components/BarraProgresso";
import { useToast } from "@/components/Toast";
import {
  atualizarMeta,
  criarAporte,
  criarMeta,
  definirPlanoMensal,
  excluirAporte,
  excluirMeta,
} from "@/server/metas";
import { formatarBRL } from "@/lib/dinheiro";
import { NOMES_MESES, somarMeses } from "@/lib/datas";

export type MetaDTO = {
  id: string;
  nome: string;
  valorTotalCentavos: number;
  dataAlvoISO: string | null;
  aportes: { id: string; dataISO: string; valorCentavos: number }[];
  planos: { ano: number; mes: number; valorCentavos: number }[];
};

export default function GerenciarMetas({
  metas,
  hoje,
  anoAtual,
  mesAtual,
}: {
  metas: MetaDTO[];
  hoje: string;
  anoAtual: number;
  mesAtual: number;
}) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<MetaDTO | null>(null);
  const [aportando, setAportando] = useState<MetaDTO | null>(null);
  const [planejando, setPlanejando] = useState<MetaDTO | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Metas</h1>
          <p className="text-xs text-slate-500">Objetivos financeiros do casal</p>
        </div>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300"
        >
          <Plus size={14} /> Nova meta
        </button>
      </header>

      {metas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
          Nenhuma meta ainda.
          <br />
          <span className="text-xs">Ex.: “Viagem Foz”, “Investimento Dennis”…</span>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {metas.map((m) => (
            <CartaoMeta
              key={m.id}
              meta={m}
              anoAtual={anoAtual}
              mesAtual={mesAtual}
              aoAportar={() => setAportando(m)}
              aoEditar={() => setEditando(m)}
              aoPlanejar={() => setPlanejando(m)}
            />
          ))}
        </div>
      )}

      {(criando || editando) && (
        <FormMeta
          meta={editando}
          aoFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}

      {aportando && (
        <FormAporte meta={aportando} hoje={hoje} aoFechar={() => setAportando(null)} />
      )}

      {planejando && (
        <FormPlano
          meta={planejando}
          anoAtual={anoAtual}
          mesAtual={mesAtual}
          aoFechar={() => setPlanejando(null)}
        />
      )}
    </div>
  );
}

function CartaoMeta({
  meta,
  anoAtual,
  mesAtual,
  aoAportar,
  aoEditar,
  aoPlanejar,
}: {
  meta: MetaDTO;
  anoAtual: number;
  mesAtual: number;
  aoAportar: () => void;
  aoEditar: () => void;
  aoPlanejar: () => void;
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [expandida, setExpandida] = useState(false);

  const aportado = meta.aportes.reduce((s, a) => s + a.valorCentavos, 0);
  const fracao = meta.valorTotalCentavos > 0 ? aportado / meta.valorTotalCentavos : 0;
  const planoDoMes = meta.planos.find((p) => p.ano === anoAtual && p.mes === mesAtual);
  const aportadoNoMes = meta.aportes
    .filter((a) => {
      const [ano, mes] = a.dataISO.split("-").map(Number);
      return ano === anoAtual && mes === mesAtual;
    })
    .reduce((s, a) => s + a.valorCentavos, 0);

  function excluir() {
    if (!confirm(`Excluir a meta "${meta.nome}" e todo o histórico de aportes?`)) return;
    iniciar(async () => {
      const r = await excluirMeta(meta.id);
      if (r.ok) toast("Meta excluída ✓");
      else toast(r.erro ?? "Erro.", "erro");
    });
  }

  function removerAporte(id: string) {
    if (!confirm("Excluir este aporte?")) return;
    iniciar(async () => {
      const r = await excluirAporte(id);
      if (r.ok) toast("Aporte excluído ✓");
      else toast(r.erro ?? "Erro.", "erro");
    });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{meta.nome}</p>
          {meta.dataAlvoISO && (
            <p className="flex items-center gap-1 text-[11px] text-slate-500">
              <CalendarClock size={12} />
              alvo: {meta.dataAlvoISO.split("-").reverse().join("/")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={aoEditar}
            className="rounded-full p-1.5 text-slate-500 hover:text-slate-200"
            aria-label="Editar meta"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={excluir}
            className="rounded-full p-1.5 text-slate-500 hover:text-rose-400"
            aria-label="Excluir meta"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-bold text-emerald-400">{formatarBRL(aportado)}</span>
          <span className="text-xs text-slate-500">
            de {formatarBRL(meta.valorTotalCentavos)} ({Math.min(100, fracao * 100).toFixed(0)}%)
          </span>
        </div>
        <BarraProgresso fracao={fracao} altura={10} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          Este mês: <strong className="text-slate-200">{formatarBRL(aportadoNoMes)}</strong>
          {planoDoMes && (
            <span className="text-slate-500"> / plano {formatarBRL(planoDoMes.valorCentavos)}</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setExpandida(!expandida)}
          className="flex items-center gap-0.5 text-slate-500"
        >
          {expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expandida ? "menos" : "detalhes"}
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={aoAportar}
          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-emerald-950"
        >
          + Aportar
        </button>
        <button
          type="button"
          onClick={aoPlanejar}
          className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300"
        >
          Planejar meses
        </button>
      </div>

      {expandida && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Aportes ({meta.aportes.length})
          </p>
          {meta.aportes.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum aporte ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {meta.aportes.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-sm"
                >
                  <span className="text-xs text-slate-400">
                    {a.dataISO.split("-").reverse().join("/")}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-400">
                      {formatarBRL(a.valorCentavos)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerAporte(a.id)}
                      className="text-slate-600 hover:text-rose-400"
                      aria-label="Excluir aporte"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FormMeta({ meta, aoFechar }: { meta: MetaDTO | null; aoFechar: () => void }) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();
  const [nome, setNome] = useState(meta?.nome ?? "");
  const [centavos, setCentavos] = useState(meta?.valorTotalCentavos ?? 0);
  const [dataAlvo, setDataAlvo] = useState(meta?.dataAlvoISO ?? "");

  function salvar() {
    iniciar(async () => {
      const dados = {
        nome,
        valorTotalCentavos: centavos,
        dataAlvoISO: dataAlvo || null,
      };
      const r = meta ? await atualizarMeta(meta.id, dados) : await criarMeta(dados);
      if (r.ok) {
        toast(meta ? "Meta atualizada ✓" : "Meta criada ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  return (
    <Folha aberta aoFechar={aoFechar} titulo={meta ? "Editar meta" : "Nova meta"}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome do objetivo</span>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Viagem Foz"
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none placeholder:text-slate-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Valor total da meta</span>
          <CampoValor centavos={centavos} aoMudar={setCentavos} />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Data alvo (opcional)</span>
          <input
            type="date"
            value={dataAlvo}
            onChange={(e) => setDataAlvo(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          />
        </label>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || centavos <= 0 || !nome.trim()}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Folha>
  );
}

function FormAporte({
  meta,
  hoje,
  aoFechar,
}: {
  meta: MetaDTO;
  hoje: string;
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();
  const [centavos, setCentavos] = useState(0);
  const [dataISO, setDataISO] = useState(hoje);

  function salvar() {
    iniciar(async () => {
      const r = await criarAporte(meta.id, { valorCentavos: centavos, dataISO });
      if (r.ok) {
        toast("Aporte registrado ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  return (
    <Folha aberta aoFechar={aoFechar} titulo={`Aportar em "${meta.nome}"`}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Valor do aporte</span>
          <CampoValor centavos={centavos} aoMudar={setCentavos} autoFoco />
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

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || centavos <= 0}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Registrar aporte"}
        </button>
      </div>
    </Folha>
  );
}

function FormPlano({
  meta,
  anoAtual,
  mesAtual,
  aoFechar,
}: {
  meta: MetaDTO;
  anoAtual: number;
  mesAtual: number;
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const meses = Array.from({ length: 12 }, (_, i) => somarMeses(anoAtual, mesAtual, i));
  const [valores, setValores] = useState<Record<string, number>>(() => {
    const iniciais: Record<string, number> = {};
    for (const c of meses) {
      const plano = meta.planos.find((p) => p.ano === c.ano && p.mes === c.mes);
      iniciais[`${c.ano}-${c.mes}`] = plano?.valorCentavos ?? 0;
    }
    return iniciais;
  });

  const totalPlanejado = Object.values(valores).reduce((s, v) => s + v, 0);

  function salvar() {
    iniciar(async () => {
      for (const c of meses) {
        const chave = `${c.ano}-${c.mes}`;
        const original =
          meta.planos.find((p) => p.ano === c.ano && p.mes === c.mes)?.valorCentavos ?? 0;
        if (valores[chave] !== original) {
          const r = await definirPlanoMensal(meta.id, c.ano, c.mes, valores[chave]);
          if (!r.ok) {
            toast(r.erro ?? "Erro ao salvar plano.", "erro");
            return;
          }
        }
      }
      toast("Plano mensal salvo ✓");
      aoFechar();
    });
  }

  return (
    <Folha aberta aoFechar={aoFechar} titulo={`Planejar "${meta.nome}"`}>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500">
          Quanto pretendem colocar na meta em cada mês (próximos 12 meses).
        </p>
        {meses.map((c) => {
          const chave = `${c.ano}-${c.mes}`;
          return (
            <div key={chave} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-slate-400">
                {NOMES_MESES[c.mes - 1].slice(0, 3)}/{String(c.ano).slice(2)}
              </span>
              <div className="flex-1">
                <CampoValor
                  centavos={valores[chave]}
                  aoMudar={(v) => setValores((atual) => ({ ...atual, [chave]: v }))}
                />
              </div>
            </div>
          );
        })}
        <p className="mt-1 text-right text-xs text-slate-400">
          Total planejado: <strong>{formatarBRL(totalPlanejado)}</strong>
        </p>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar plano"}
        </button>
      </div>
    </Folha>
  );
}
