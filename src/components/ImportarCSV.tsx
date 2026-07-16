"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp } from "lucide-react";
import SeletorOpcoes from "@/components/SeletorOpcoes";
import { useToast } from "@/components/Toast";
import { importarCSV } from "@/server/importar";
import { NOMES_MESES } from "@/lib/datas";

export default function ImportarCSV({
  anoAtual,
  mesAtual,
}: {
  anoAtual: number;
  mesAtual: number;
}) {
  const toast = useToast();
  const [importando, iniciar] = useTransition();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState<"gastos" | "entradas">("gastos");
  const [csv, setCsv] = useState("");
  const [mes, setMes] = useState(String(mesAtual));
  const [ano, setAno] = useState(String(anoAtual));
  const [avisos, setAvisos] = useState<string[]>([]);

  const numLinhas = csv.trim() ? Math.max(0, csv.trim().split(/\r?\n/).length - 1) : 0;

  function lerArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setCsv(String(leitor.result ?? ""));
    leitor.readAsText(arquivo);
  }

  function importar() {
    iniciar(async () => {
      setAvisos([]);
      const r = await importarCSV({
        tipo,
        csv,
        anoPadrao: parseInt(ano, 10),
        mesPadrao: parseInt(mes, 10),
      });
      if (r.ok) {
        toast(`${r.importados} linha(s) importada(s) ✓`);
        setAvisos(r.avisos ?? []);
        setCsv("");
        if (inputArquivo.current) inputArquivo.current.value = "";
      } else {
        toast(r.erro ?? "Erro na importação.", "erro");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold">Importar da planilha</h1>
        <p className="text-xs text-slate-500">
          No Google Sheets: Arquivo → Fazer download → CSV (uma aba por vez)
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-400">
        <p className="mb-1 font-semibold text-slate-300">Como funciona</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            A 1ª linha precisa ser o cabeçalho. Colunas reconhecidas:{" "}
            <strong>Data, Descrição/Nome, Valor, Categoria, Forma, Responsável, Pago</strong>{" "}
            (só Descrição e Valor são obrigatórias).
          </li>
          <li>
            Datas aceitas: <code>15/03/2025</code>, <code>15/03</code> ou só o dia{" "}
            <code>15</code> — o que faltar vem do mês/ano padrão abaixo.
          </li>
          <li>Valores no formato brasileiro: 1.234,56.</li>
          <li>Categorias que não existirem serão criadas automaticamente.</li>
          <li>Importe cada aba/mês da planilha separadamente, ajustando o mês padrão.</li>
        </ul>
      </section>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-slate-400">O que você está importando?</span>
        <SeletorOpcoes
          opcoes={[
            { valor: "gastos" as const, rotulo: "Gastos" },
            { valor: "entradas" as const, rotulo: "Entradas" },
          ]}
          valor={tipo}
          aoMudar={setTipo}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Mês padrão</span>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          >
            {NOMES_MESES.map((n, i) => (
              <option key={n} value={i + 1}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Ano padrão</span>
          <input
            type="number"
            inputMode="numeric"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => inputArquivo.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400"
        >
          <FileUp size={16} /> Escolher arquivo .csv
        </button>
        <input
          ref={inputArquivo}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={lerArquivo}
          className="hidden"
        />
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={"…ou cole o conteúdo aqui.\n\nData;Descrição;Valor;Categoria;Forma\n05/03;Mercado da semana;385,90;Mercado;Pix"}
          rows={8}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-xs outline-none placeholder:text-slate-600"
        />
        {numLinhas > 0 && (
          <p className="text-xs text-slate-500">{numLinhas} linha(s) de dados detectada(s).</p>
        )}
      </div>

      <button
        type="button"
        onClick={importar}
        disabled={importando || !csv.trim()}
        className="rounded-2xl bg-emerald-500 py-3.5 font-bold text-emerald-950 disabled:opacity-30"
      >
        {importando ? "Importando…" : "Importar"}
      </button>

      {avisos.length > 0 && (
        <section className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-300">
          <p className="mb-1 font-semibold">Avisos da importação:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
