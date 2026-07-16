"use client";

import { useState, useTransition } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import Folha from "@/components/Folha";
import CampoValor from "@/components/CampoValor";
import SeletorOpcoes from "@/components/SeletorOpcoes";
import { useToast } from "@/components/Toast";
import {
  alternarPago,
  alternarPausada,
  atualizarTransacao,
  excluirTransacao,
} from "@/server/transacoes";
import { formatarBRL } from "@/lib/dinheiro";
import { FORMAS_PAGAMENTO, RESPONSAVEIS, rotuloFormaPagamento } from "@/lib/rotulos";
import type { CategoriaResumo, TransacaoDTO } from "@/lib/tipos";
import type { FormaPagamento, Responsavel } from "@/generated/prisma/enums";

function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function ListaTransacoes({
  transacoes,
  categorias,
}: {
  transacoes: TransacaoDTO[];
  categorias: CategoriaResumo[];
}) {
  const [selecionada, setSelecionada] = useState<TransacaoDTO | null>(null);
  const toast = useToast();
  const [, iniciar] = useTransition();

  if (transacoes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
        Nenhum lançamento neste mês.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-1">
        {transacoes.map((t) => (
          <li key={t.id}>
            <div
              className={`flex items-center gap-2.5 rounded-xl bg-slate-900 px-2.5 py-2.5 ${
                t.pausada ? "opacity-40" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={t.pago}
                onChange={() =>
                  iniciar(async () => {
                    const r = await alternarPago(t.id);
                    if (!r.ok) toast(r.erro ?? "Erro", "erro");
                  })
                }
                title="Pago?"
                className="h-5 w-5 shrink-0 accent-emerald-500"
              />
              <button
                type="button"
                onClick={() => setSelecionada(t)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: `${t.categoria.cor}26` }}
                >
                  {t.categoria.icone}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {t.descricao}
                    {t.tipo === "PARCELADO" && t.parcelaNumero && t.totalParcelas && (
                      <span className="ml-1.5 rounded bg-sky-500/15 px-1 py-0.5 text-[10px] font-semibold text-sky-300">
                        {t.parcelaNumero}/{t.totalParcelas}
                      </span>
                    )}
                    {t.tipo === "FIXO" && (
                      <span className="ml-1.5 rounded bg-violet-500/15 px-1 py-0.5 text-[10px] font-semibold text-violet-300">
                        fixo
                      </span>
                    )}
                    {t.pausada && (
                      <span className="ml-1.5 rounded bg-slate-700 px-1 py-0.5 text-[10px] font-semibold text-slate-300">
                        pausado
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {dataCurta(t.dataISO)} · {rotuloFormaPagamento(t.formaPagamento)} ·{" "}
                    {t.responsavel === "CASAL" ? "Casal" : t.responsavel === "DENNIS" ? "D" : "P"}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    t.pago ? "text-slate-300" : "text-amber-300"
                  }`}
                >
                  {formatarBRL(t.valorCentavos)}
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selecionada && (
        <FormEditarTransacao
          transacao={selecionada}
          categorias={categorias}
          aoFechar={() => setSelecionada(null)}
        />
      )}
    </>
  );
}

function FormEditarTransacao({
  transacao,
  categorias,
  aoFechar,
}: {
  transacao: TransacaoDTO;
  categorias: CategoriaResumo[];
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const [descricao, setDescricao] = useState(transacao.descricao);
  const [centavos, setCentavos] = useState(transacao.valorCentavos);
  const [dataISO, setDataISO] = useState(transacao.dataISO);
  const [categoriaId, setCategoriaId] = useState(transacao.categoria.id);
  const [forma, setForma] = useState<FormaPagamento>(transacao.formaPagamento);
  const [responsavel, setResponsavel] = useState<Responsavel>(transacao.responsavel);
  const [pago, setPago] = useState(transacao.pago);
  const [observacao, setObservacao] = useState(transacao.observacao ?? "");

  function salvar() {
    iniciar(async () => {
      const r = await atualizarTransacao(transacao.id, {
        descricao,
        valorCentavos: centavos,
        categoriaId,
        formaPagamento: forma,
        responsavel,
        dataISO,
        pago,
        observacao,
      });
      if (r.ok) {
        toast("Lançamento atualizado ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  function excluir() {
    const msg = transacao.ehFixo
      ? "Este é um gasto fixo: ele será PAUSADO neste mês (não some dos outros meses). Confirmar?"
      : transacao.tipo === "PARCELADO"
        ? "Excluir só esta parcela? (para excluir a compra toda, use a tela Parcelas)"
        : "Excluir este lançamento?";
    if (!confirm(msg)) return;
    iniciar(async () => {
      const r = await excluirTransacao(transacao.id);
      if (r.ok) {
        toast(transacao.ehFixo ? "Pausado neste mês ✓" : "Excluído ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro.", "erro");
      }
    });
  }

  function pausarReativar() {
    iniciar(async () => {
      const r = await alternarPausada(transacao.id);
      if (r.ok) {
        toast(transacao.pausada ? "Reativado neste mês ✓" : "Pausado neste mês ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro.", "erro");
      }
    });
  }

  return (
    <Folha aberta aoFechar={aoFechar} titulo="Editar lançamento">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição</span>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
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

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Categoria</span>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icone} {c.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Pagamento</span>
          <SeletorOpcoes
            opcoes={FORMAS_PAGAMENTO.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
            valor={forma}
            aoMudar={setForma}
          />
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Quem gastou</span>
          <SeletorOpcoes
            opcoes={RESPONSAVEIS.map((r) => ({ valor: r.valor, rotulo: r.rotulo }))}
            valor={responsavel}
            aoMudar={setResponsavel}
          />
        </div>

        <label className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Já foi pago/debitado?</span>
          <input
            type="checkbox"
            checked={pago}
            onChange={(e) => setPago(e.target.checked)}
            className="h-5 w-5 accent-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Observação</span>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          />
        </label>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>

        <div className="flex gap-2">
          {transacao.ehFixo && (
            <button
              type="button"
              onClick={pausarReativar}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-700 py-3 text-sm font-medium text-slate-300"
            >
              {transacao.pausada ? <Play size={16} /> : <Pause size={16} />}
              {transacao.pausada ? "Reativar no mês" : "Pausar no mês"}
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
      </div>
    </Folha>
  );
}
