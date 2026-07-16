"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ajustarDia, dataDe, ultimoDiaDoMes } from "@/lib/datas";
import type { FormaPagamento, Responsavel } from "@/generated/prisma/enums";

export type ResultadoImportacao = {
  ok: boolean;
  erro?: string;
  importados?: number;
  avisos?: string[];
};

/** Parser CSV simples com suporte a campos entre aspas. */
function parseCSV(texto: string): string[][] {
  const primeiraLinha = texto.split(/\r?\n/, 1)[0] ?? "";
  const contagens: [string, number][] = [
    [";", (primeiraLinha.match(/;/g) ?? []).length],
    ["\t", (primeiraLinha.match(/\t/g) ?? []).length],
    [",", (primeiraLinha.match(/,/g) ?? []).length],
  ];
  contagens.sort((a, b) => b[1] - a[1]);
  const sep = contagens[0][1] > 0 ? contagens[0][0] : ",";

  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let emAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (emAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          emAspas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      emAspas = true;
    } else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      if (linha.some((x) => x.trim() !== "")) linhas.push(linha);
      linha = [];
    } else {
      campo += c;
    }
  }
  linha.push(campo);
  if (linha.some((x) => x.trim() !== "")) linhas.push(linha);
  return linhas;
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function acharColuna(cabecalho: string[], nomes: string[]): number {
  for (const nome of nomes) {
    const i = cabecalho.findIndex((c) => normalizar(c).includes(nome));
    if (i >= 0) return i;
  }
  return -1;
}

function parseValorBR(texto: string): number | null {
  const limpo = texto.replace(/[R$\s]/g, "").replace(/^-/, "");
  if (!limpo) return null;
  let normalizado: string;
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else {
    normalizado = limpo;
  }
  const n = Number(normalizado);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function parseDataFlexivel(
  texto: string,
  anoPadrao: number,
  mesPadrao: number
): { ano: number; mes: number; dia: number } | null {
  const t = texto.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) return { ano: +m[1], mes: +m[2], dia: +m[3] };
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (m) return { ano: +m[3], mes: +m[2], dia: +m[1] };
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(t);
  if (m) return { ano: 2000 + +m[3], mes: +m[2], dia: +m[1] };
  m = /^(\d{1,2})\/(\d{1,2})$/.exec(t);
  if (m) return { ano: anoPadrao, mes: +m[2], dia: +m[1] };
  m = /^(\d{1,2})$/.exec(t);
  if (m) return { ano: anoPadrao, mes: mesPadrao, dia: +m[1] };
  return null;
}

function mapearForma(texto: string): FormaPagamento {
  const t = normalizar(texto);
  if (t.includes("pix")) return "PIX";
  if (t.includes("deb")) return "DEBITO";
  if (t.includes("cred") || t.includes("cartao")) return "CREDITO";
  if (t.includes("dinheiro") || t.includes("especie")) return "DINHEIRO";
  return "OUTRO";
}

function mapearResponsavel(texto: string): Responsavel {
  const t = normalizar(texto);
  if (t.includes("dennis")) return "DENNIS";
  if (t.includes("patri")) return "PATRIZZIA";
  return "CASAL";
}

async function obterCategoria(
  nome: string,
  cache: Map<string, string>,
  avisos: string[]
): Promise<string> {
  const chave = normalizar(nome) || "outro";
  const existente = cache.get(chave);
  if (existente) return existente;

  const todas = await prisma.categoria.findMany();
  for (const c of todas) cache.set(normalizar(c.nome), c.id);
  const denovo = cache.get(chave);
  if (denovo) return denovo;

  if (!nome.trim()) {
    const outro = todas.find((c) => normalizar(c.nome) === "outro");
    if (outro) {
      cache.set(chave, outro.id);
      return outro.id;
    }
  }

  const nova = await prisma.categoria.create({
    data: { nome: nome.trim() || "Outro", ordem: 99 },
  });
  avisos.push(`Categoria "${nova.nome}" foi criada automaticamente.`);
  cache.set(chave, nova.id);
  return nova.id;
}

export async function importarCSV(dados: {
  tipo: "gastos" | "entradas";
  csv: string;
  anoPadrao: number;
  mesPadrao: number;
}): Promise<ResultadoImportacao> {
  const { tipo, csv, anoPadrao, mesPadrao } = dados;
  if (!csv.trim()) return { ok: false, erro: "Cole o conteúdo do CSV primeiro." };
  if (mesPadrao < 1 || mesPadrao > 12 || anoPadrao < 2000 || anoPadrao > 2100)
    return { ok: false, erro: "Mês/ano padrão inválidos." };

  const linhas = parseCSV(csv);
  if (linhas.length < 2)
    return { ok: false, erro: "CSV precisa de cabeçalho + pelo menos 1 linha." };

  const cabecalho = linhas[0];
  const colData = acharColuna(cabecalho, ["data", "dia"]);
  const colDescricao = acharColuna(cabecalho, ["descricao", "nome", "gasto", "origem", "item"]);
  const colValor = acharColuna(cabecalho, ["valor", "preco", "quantia"]);
  const colCategoria = acharColuna(cabecalho, ["categoria"]);
  const colForma = acharColuna(cabecalho, ["forma", "pagamento", "metodo"]);
  const colResponsavel = acharColuna(cabecalho, ["responsavel", "quem"]);
  const colPago = acharColuna(cabecalho, ["pago", "debitado", "status"]);

  if (colValor < 0)
    return { ok: false, erro: 'Não achei a coluna "Valor" no cabeçalho.' };
  if (colDescricao < 0)
    return { ok: false, erro: 'Não achei a coluna "Descrição"/"Nome" no cabeçalho.' };

  const avisos: string[] = [];
  const cacheCategorias = new Map<string, string>();
  let importados = 0;

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    const numLinha = i + 1;

    const valor = parseValorBR(linha[colValor] ?? "");
    if (valor === null) {
      avisos.push(`Linha ${numLinha}: valor inválido ("${linha[colValor] ?? ""}") — pulada.`);
      continue;
    }

    const descricao = (linha[colDescricao] ?? "").trim();
    if (!descricao) {
      avisos.push(`Linha ${numLinha}: sem descrição — pulada.`);
      continue;
    }

    let d = { ano: anoPadrao, mes: mesPadrao, dia: ultimoDiaDoMes(anoPadrao, mesPadrao) };
    if (colData >= 0 && (linha[colData] ?? "").trim()) {
      const parseada = parseDataFlexivel(linha[colData], anoPadrao, mesPadrao);
      if (parseada) {
        d = { ...parseada, dia: ajustarDia(parseada.ano, parseada.mes, parseada.dia) };
      } else {
        avisos.push(`Linha ${numLinha}: data "${linha[colData]}" não reconhecida — usei ${mesPadrao}/${anoPadrao}.`);
      }
    }

    const responsavel =
      colResponsavel >= 0 ? mapearResponsavel(linha[colResponsavel] ?? "") : "CASAL";
    const pago =
      colPago >= 0
        ? ["sim", "s", "x", "true", "1", "pago", "ok"].includes(
            normalizar(linha[colPago] ?? "")
          )
        : true;

    if (tipo === "entradas") {
      await prisma.entrada.create({
        data: {
          nome: descricao,
          valorCentavos: valor,
          data: dataDe(d.ano, d.mes, d.dia),
          anoRef: d.ano,
          mesRef: d.mes,
          responsavel,
        },
      });
    } else {
      const categoriaId = await obterCategoria(
        colCategoria >= 0 ? (linha[colCategoria] ?? "") : "",
        cacheCategorias,
        avisos
      );
      await prisma.transacao.create({
        data: {
          descricao,
          valorCentavos: valor,
          data: dataDe(d.ano, d.mes, d.dia),
          anoRef: d.ano,
          mesRef: d.mes,
          tipo: "VARIAVEL",
          formaPagamento: colForma >= 0 ? mapearForma(linha[colForma] ?? "") : "OUTRO",
          pago,
          responsavel,
          categoriaId,
        },
      });
    }
    importados++;
  }

  revalidatePath("/", "layout");
  return { ok: true, importados, avisos };
}
