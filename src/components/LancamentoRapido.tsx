"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CampoValor from "@/components/CampoValor";
import SeletorCategorias from "@/components/SeletorCategorias";
import SeletorOpcoes from "@/components/SeletorOpcoes";
import { useToast } from "@/components/Toast";
import { criarGastoRapido } from "@/server/transacoes";
import { formatarBRL } from "@/lib/dinheiro";
import { FORMAS_PAGAMENTO, RESPONSAVEIS } from "@/lib/rotulos";
import type { CategoriaResumo } from "@/lib/tipos";
import type { FormaPagamento, Responsavel } from "@/generated/prisma/enums";

export default function LancamentoRapido({
  categorias,
  hoje,
}: {
  categorias: CategoriaResumo[];
  hoje: string;
}) {
  const toast = useToast();
  const [salvando, iniciarSalvar] = useTransition();

  const [centavos, setCentavos] = useState(0);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [responsavel, setResponsavel] = useState<Responsavel>("CASAL");

  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [dataISO, setDataISO] = useState(hoje);
  const [observacao, setObservacao] = useState("");
  const [pagoManual, setPagoManual] = useState<boolean | null>(null);

  const [ehParcelado, setEhParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState("");
  const [primeiraParcelaISO, setPrimeiraParcelaISO] = useState(hoje);

  // Pix/débito/dinheiro normalmente já saíram da conta; crédito ainda não.
  const pago = pagoManual ?? forma !== "CREDITO";
  const nParcelas = parseInt(totalParcelas, 10) || 0;
  const podeSalvar =
    centavos > 0 && categoriaId !== null && (!ehParcelado || nParcelas >= 2);

  function limpar() {
    setCentavos(0);
    setCategoriaId(null);
    setDescricao("");
    setObservacao("");
    setPagoManual(null);
    setEhParcelado(false);
    setTotalParcelas("");
    setDataISO(hoje);
    setPrimeiraParcelaISO(hoje);
    setMostrarDetalhes(false);
  }

  function salvar() {
    if (!podeSalvar || salvando) return;
    iniciarSalvar(async () => {
      const r = await criarGastoRapido({
        valorCentavos: centavos,
        categoriaId: categoriaId!,
        formaPagamento: forma,
        responsavel,
        descricao,
        dataISO,
        pago,
        observacao,
        parcelado: ehParcelado
          ? { totalParcelas: nParcelas, primeiraParcelaISO }
          : null,
      });
      if (r.ok) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(40);
        }
        toast(ehParcelado ? "Compra parcelada registrada ✓" : "Gasto registrado ✓");
        limpar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-bold">Novo gasto</h1>
        <span className="text-xs text-slate-500">
          {dataISO.split("-").reverse().join("/")}
        </span>
      </header>

      <div className="py-2">
        <CampoValor centavos={centavos} aoMudar={setCentavos} grande autoFoco />
        {ehParcelado && nParcelas >= 2 && centavos > 0 && (
          <p className="mt-2 text-center text-xs text-slate-400">
            {nParcelas}× de {formatarBRL(centavos)} = total{" "}
            {formatarBRL(centavos * nParcelas)}
          </p>
        )}
      </div>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Categoria
        </p>
        <SeletorCategorias
          categorias={categorias}
          valor={categoriaId}
          aoMudar={setCategoriaId}
        />
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pagamento
        </p>
        <SeletorOpcoes
          opcoes={FORMAS_PAGAMENTO.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
          valor={forma}
          aoMudar={setForma}
        />
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quem gastou
        </p>
        <SeletorOpcoes
          opcoes={RESPONSAVEIS.map((r) => ({ valor: r.valor, rotulo: r.rotulo }))}
          valor={responsavel}
          aoMudar={setResponsavel}
        />
      </section>

      <button
        type="button"
        onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
        className="flex items-center justify-center gap-1 text-sm text-slate-400"
      >
        {mostrarDetalhes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {mostrarDetalhes ? "Menos detalhes" : "Mais detalhes"}
      </button>

      {mostrarDetalhes && (
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Nome / descrição</span>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Mercado da semana"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none placeholder:text-slate-600"
            />
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

          <label className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Já foi pago/debitado?</span>
            <input
              type="checkbox"
              checked={pago}
              onChange={(e) => setPagoManual(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Observação</span>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Opcional"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none placeholder:text-slate-600"
            />
          </label>

          <hr className="border-slate-800" />

          <label className="flex items-center justify-between text-sm">
            <span className="font-medium">É uma compra parcelada?</span>
            <input
              type="checkbox"
              checked={ehParcelado}
              onChange={(e) => setEhParcelado(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          {ehParcelado && (
            <div className="flex flex-col gap-3">
              <p className="rounded-lg bg-slate-800/80 px-3 py-2 text-xs text-slate-400">
                O valor lá em cima é o valor de <strong>cada parcela</strong>. As
                parcelas futuras entram automaticamente nos próximos meses.
              </p>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Número de parcelas</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={120}
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  placeholder="Ex.: 12"
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none placeholder:text-slate-600"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Data da 1ª parcela</span>
                <input
                  type="date"
                  value={primeiraParcelaISO}
                  onChange={(e) => setPrimeiraParcelaISO(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
                />
                <span className="text-xs text-slate-500">
                  Se a fatura fecha depois, coloque a data no mês seguinte.
                </span>
              </label>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={!podeSalvar || salvando}
        className="rounded-2xl bg-emerald-500 py-4 text-base font-bold text-emerald-950 transition-opacity disabled:opacity-30"
      >
        {salvando ? "Salvando…" : "Salvar gasto"}
      </button>
    </div>
  );
}
