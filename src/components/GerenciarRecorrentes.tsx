"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import Folha from "@/components/Folha";
import CampoValor from "@/components/CampoValor";
import SeletorOpcoes from "@/components/SeletorOpcoes";
import { useToast } from "@/components/Toast";
import {
  alternarAtivaReceita,
  alternarAtivoGastoFixo,
  atualizarGastoFixo,
  atualizarReceitaRecorrente,
  criarGastoFixo,
  criarReceitaRecorrente,
  excluirGastoFixo,
  excluirReceitaRecorrente,
} from "@/server/fixos";
import { formatarBRL } from "@/lib/dinheiro";
import { FORMAS_PAGAMENTO, RESPONSAVEIS, rotuloResponsavel } from "@/lib/rotulos";
import type { CategoriaResumo } from "@/lib/tipos";
import type { FormaPagamento, Responsavel } from "@/generated/prisma/enums";

export type GastoFixoDTO = {
  id: string;
  descricao: string;
  valorCentavos: number;
  diaDoMes: number;
  categoria: CategoriaResumo;
  formaPagamento: FormaPagamento;
  responsavel: Responsavel;
  ativo: boolean;
};

export type ReceitaDTO = {
  id: string;
  nome: string;
  valorCentavos: number;
  diaDoMes: number;
  responsavel: Responsavel;
  ativo: boolean;
};

export default function GerenciarRecorrentes({
  fixos,
  receitas,
  categorias,
}: {
  fixos: GastoFixoDTO[];
  receitas: ReceitaDTO[];
  categorias: CategoriaResumo[];
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [fixoEditando, setFixoEditando] = useState<GastoFixoDTO | null>(null);
  const [criandoFixo, setCriandoFixo] = useState(false);
  const [receitaEditando, setReceitaEditando] = useState<ReceitaDTO | null>(null);
  const [criandoReceita, setCriandoReceita] = useState(false);

  const totalFixos = fixos
    .filter((f) => f.ativo)
    .reduce((s, f) => s + f.valorCentavos, 0);
  const totalReceitas = receitas
    .filter((r) => r.ativo)
    .reduce((s, r) => s + r.valorCentavos, 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-bold">Fixos e recorrentes</h1>
        <p className="text-xs text-slate-500">
          Nascem sozinhos em cada mês novo — cadastre uma vez só.
        </p>
      </header>

      {/* Gastos fixos */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Gastos fixos · {formatarBRL(totalFixos)}/mês
          </h2>
          <button
            type="button"
            onClick={() => setCriandoFixo(true)}
            className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300"
          >
            <Plus size={14} /> Novo
          </button>
        </div>
        {fixos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
            Nenhum gasto fixo cadastrado (aluguel, internet, academia…).
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {fixos.map((f) => (
              <li key={f.id}>
                <div
                  className={`flex w-full items-center gap-2.5 rounded-xl bg-slate-900 px-3 py-2.5 ${
                    f.ativo ? "" : "opacity-40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFixoEditando(f)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                      style={{ backgroundColor: `${f.categoria.cor}26` }}
                    >
                      {f.categoria.icone}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {f.descricao}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        todo dia {f.diaDoMes} · {rotuloResponsavel(f.responsavel)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatarBRL(f.valorCentavos)}
                    </span>
                  </button>
                  <label className="ml-1 inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={f.ativo}
                      onChange={() =>
                        iniciar(async () => {
                          const r = await alternarAtivoGastoFixo(f.id);
                          if (r.ok)
                            toast(f.ativo ? "Gasto fixo desativado" : "Gasto fixo reativado ✓");
                          else toast(r.erro ?? "Erro.", "erro");
                        })
                      }
                      className="peer sr-only"
                    />
                    <span className="h-6 w-10 rounded-full bg-slate-700 transition-colors peer-checked:bg-emerald-500 after:mt-0.5 after:ml-0.5 after:block after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Receitas recorrentes */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Receitas recorrentes · {formatarBRL(totalReceitas)}/mês
          </h2>
          <button
            type="button"
            onClick={() => setCriandoReceita(true)}
            className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300"
          >
            <Plus size={14} /> Nova
          </button>
        </div>
        {receitas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
            Nenhuma receita recorrente (salários, rendas…).
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {receitas.map((r) => (
              <li key={r.id}>
                <div
                  className={`flex w-full items-center gap-2.5 rounded-xl bg-slate-900 px-3 py-2.5 ${
                    r.ativo ? "" : "opacity-40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setReceitaEditando(r)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.nome}</span>
                      <span className="block text-[11px] text-slate-500">
                        todo dia {r.diaDoMes} · {rotuloResponsavel(r.responsavel)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-emerald-400">
                      {formatarBRL(r.valorCentavos)}
                    </span>
                  </button>
                  <label className="ml-1 inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={r.ativo}
                      onChange={() =>
                        iniciar(async () => {
                          const res = await alternarAtivaReceita(r.id);
                          if (res.ok)
                            toast(r.ativo ? "Receita desativada" : "Receita reativada ✓");
                          else toast(res.erro ?? "Erro.", "erro");
                        })
                      }
                      className="peer sr-only"
                    />
                    <span className="h-6 w-10 rounded-full bg-slate-700 transition-colors peer-checked:bg-emerald-500 after:mt-0.5 after:ml-0.5 after:block after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(criandoFixo || fixoEditando) && (
        <FormGastoFixo
          fixo={fixoEditando}
          categorias={categorias}
          aoFechar={() => {
            setCriandoFixo(false);
            setFixoEditando(null);
          }}
        />
      )}

      {(criandoReceita || receitaEditando) && (
        <FormReceita
          receita={receitaEditando}
          aoFechar={() => {
            setCriandoReceita(false);
            setReceitaEditando(null);
          }}
        />
      )}
    </div>
  );
}

function FormGastoFixo({
  fixo,
  categorias,
  aoFechar,
}: {
  fixo: GastoFixoDTO | null;
  categorias: CategoriaResumo[];
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const [descricao, setDescricao] = useState(fixo?.descricao ?? "");
  const [centavos, setCentavos] = useState(fixo?.valorCentavos ?? 0);
  const [dia, setDia] = useState(String(fixo?.diaDoMes ?? 1));
  const [categoriaId, setCategoriaId] = useState(
    fixo?.categoria.id ?? categorias.find((c) => c.nome === "Moradia")?.id ?? categorias[0]?.id ?? ""
  );
  const [forma, setForma] = useState<FormaPagamento>(fixo?.formaPagamento ?? "PIX");
  const [responsavel, setResponsavel] = useState<Responsavel>(
    fixo?.responsavel ?? "CASAL"
  );
  const [atualizarMesAtual, setAtualizarMesAtual] = useState(true);

  function salvar() {
    const diaN = parseInt(dia, 10);
    iniciar(async () => {
      const dados = {
        descricao,
        valorCentavos: centavos,
        diaDoMes: diaN,
        categoriaId,
        formaPagamento: forma,
        responsavel,
      };
      const r = fixo
        ? await atualizarGastoFixo(fixo.id, dados, atualizarMesAtual)
        : await criarGastoFixo(dados);
      if (r.ok) {
        toast(fixo ? "Gasto fixo atualizado ✓" : "Gasto fixo criado ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  function excluir() {
    if (!fixo) return;
    if (
      !confirm(
        `Excluir "${fixo.descricao}"? O histórico de meses anteriores é mantido, mas ele não será mais gerado. (Dica: para parar temporariamente, use o botão de ativar/desativar.)`
      )
    )
      return;
    iniciar(async () => {
      const r = await excluirGastoFixo(fixo.id);
      if (r.ok) {
        toast("Gasto fixo excluído ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro.", "erro");
      }
    });
  }

  return (
    <Folha aberta aoFechar={aoFechar} titulo={fixo ? "Editar gasto fixo" : "Novo gasto fixo"}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição</span>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Aluguel, Internet, Academia"
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none placeholder:text-slate-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Valor mensal</span>
          <CampoValor centavos={centavos} aoMudar={setCentavos} />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Dia do mês (vencimento)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
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
          <span className="text-slate-400">Responsável</span>
          <SeletorOpcoes
            opcoes={RESPONSAVEIS.map((r) => ({ valor: r.valor, rotulo: r.rotulo }))}
            valor={responsavel}
            aoMudar={setResponsavel}
          />
        </div>

        {fixo && (
          <label className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Atualizar também o lançamento deste mês (se não pago)</span>
            <input
              type="checkbox"
              checked={atualizarMesAtual}
              onChange={(e) => setAtualizarMesAtual(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-emerald-500"
            />
          </label>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || centavos <= 0 || !descricao.trim()}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>

        {fixo && (
          <button
            type="button"
            onClick={excluir}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-900 py-3 text-sm font-medium text-rose-400"
          >
            <Trash2 size={16} /> Excluir gasto fixo
          </button>
        )}
      </div>
    </Folha>
  );
}

function FormReceita({
  receita,
  aoFechar,
}: {
  receita: ReceitaDTO | null;
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const [nome, setNome] = useState(receita?.nome ?? "");
  const [centavos, setCentavos] = useState(receita?.valorCentavos ?? 0);
  const [dia, setDia] = useState(String(receita?.diaDoMes ?? 1));
  const [responsavel, setResponsavel] = useState<Responsavel>(
    receita?.responsavel ?? "CASAL"
  );
  const [atualizarMesAtual, setAtualizarMesAtual] = useState(true);

  function salvar() {
    const diaN = parseInt(dia, 10);
    iniciar(async () => {
      const dados = {
        nome,
        valorCentavos: centavos,
        diaDoMes: diaN,
        responsavel,
      };
      const r = receita
        ? await atualizarReceitaRecorrente(receita.id, dados, atualizarMesAtual)
        : await criarReceitaRecorrente(dados);
      if (r.ok) {
        toast(receita ? "Receita atualizada ✓" : "Receita criada ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro ao salvar.", "erro");
      }
    });
  }

  function excluir() {
    if (!receita) return;
    if (
      !confirm(
        `Excluir "${receita.nome}"? O histórico de meses anteriores é mantido.`
      )
    )
      return;
    iniciar(async () => {
      const r = await excluirReceitaRecorrente(receita.id);
      if (r.ok) {
        toast("Receita excluída ✓");
        aoFechar();
      } else {
        toast(r.erro ?? "Erro.", "erro");
      }
    });
  }

  return (
    <Folha
      aberta
      aoFechar={aoFechar}
      titulo={receita ? "Editar receita" : "Nova receita recorrente"}
    >
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
          <span className="text-slate-400">Valor mensal</span>
          <CampoValor centavos={centavos} aoMudar={setCentavos} />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Dia do mês (recebimento)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
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

        {receita && (
          <label className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Atualizar também a entrada deste mês</span>
            <input
              type="checkbox"
              checked={atualizarMesAtual}
              onChange={(e) => setAtualizarMesAtual(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-emerald-500"
            />
          </label>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || centavos <= 0 || !nome.trim()}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>

        {receita && (
          <button
            type="button"
            onClick={excluir}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-900 py-3 text-sm font-medium text-rose-400"
          >
            <Trash2 size={16} /> Excluir receita
          </button>
        )}
      </div>
    </Folha>
  );
}
