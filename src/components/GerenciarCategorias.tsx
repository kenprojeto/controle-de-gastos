"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import Folha from "@/components/Folha";
import { useToast } from "@/components/Toast";
import {
  alternarAtivaCategoria,
  atualizarCategoria,
  criarCategoria,
} from "@/server/categorias";

export type CategoriaDTO = {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  ativa: boolean;
};

export default function GerenciarCategorias({
  categorias,
}: {
  categorias: CategoriaDTO[];
}) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [editando, setEditando] = useState<CategoriaDTO | null>(null);
  const [criando, setCriando] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Categorias</h1>
          <p className="text-xs text-slate-500">Toque para editar nome, ícone e cor</p>
        </div>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300"
        >
          <Plus size={14} /> Nova
        </button>
      </header>

      <ul className="flex flex-col gap-1">
        {categorias.map((c) => (
          <li key={c.id}>
            <div
              className={`flex items-center gap-2.5 rounded-xl bg-slate-900 px-3 py-2.5 ${
                c.ativa ? "" : "opacity-40"
              }`}
            >
              <button
                type="button"
                onClick={() => setEditando(c)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: `${c.cor}26` }}
                >
                  {c.icone}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.nome}</span>
                  {c.descricao && (
                    <span className="block truncate text-[11px] text-slate-500">
                      {c.descricao}
                    </span>
                  )}
                </span>
              </button>
              <label className="inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={c.ativa}
                  onChange={() =>
                    iniciar(async () => {
                      const r = await alternarAtivaCategoria(c.id);
                      if (r.ok)
                        toast(c.ativa ? "Categoria desativada" : "Categoria reativada ✓");
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

      {(criando || editando) && (
        <FormCategoria
          categoria={editando}
          aoFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function FormCategoria({
  categoria,
  aoFechar,
}: {
  categoria: CategoriaDTO | null;
  aoFechar: () => void;
}) {
  const toast = useToast();
  const [salvando, iniciar] = useTransition();

  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [descricao, setDescricao] = useState(categoria?.descricao ?? "");
  const [icone, setIcone] = useState(categoria?.icone ?? "🏷️");
  const [cor, setCor] = useState(categoria?.cor ?? "#94a3b8");

  function salvar() {
    iniciar(async () => {
      const dados = { nome, descricao, icone, cor };
      const r = categoria
        ? await atualizarCategoria(categoria.id, dados)
        : await criarCategoria(dados);
      if (r.ok) {
        toast(categoria ? "Categoria atualizada ✓" : "Categoria criada ✓");
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
      titulo={categoria ? "Editar categoria" : "Nova categoria"}
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome</span>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Descrição (o que entra aqui?)</span>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Ícone (emoji)</span>
            <input
              type="text"
              value={icone}
              onChange={(e) => setIcone(e.target.value)}
              maxLength={4}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-center text-xl outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Cor</span>
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-[46px] w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || !nome.trim()}
          className="mt-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Folha>
  );
}
