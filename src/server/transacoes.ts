"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ajustarDia, dataDe, parseDataISO, somarMeses } from "@/lib/datas";
import type { FormaPagamento, Responsavel } from "@/generated/prisma/enums";

export type Resultado = { ok: boolean; erro?: string };

const FORMAS: FormaPagamento[] = ["PIX", "DEBITO", "CREDITO", "DINHEIRO", "OUTRO"];
const RESP: Responsavel[] = ["DENNIS", "PATRIZZIA", "CASAL"];

function validarComuns(dados: {
  valorCentavos: number;
  categoriaId: string;
  formaPagamento: string;
  responsavel: string;
  dataISO: string;
}): string | null {
  if (!Number.isInteger(dados.valorCentavos) || dados.valorCentavos <= 0)
    return "Informe um valor maior que zero.";
  if (!dados.categoriaId) return "Escolha uma categoria.";
  if (!FORMAS.includes(dados.formaPagamento as FormaPagamento))
    return "Forma de pagamento inválida.";
  if (!RESP.includes(dados.responsavel as Responsavel)) return "Responsável inválido.";
  if (!parseDataISO(dados.dataISO)) return "Data inválida.";
  return null;
}

export async function criarGastoRapido(dados: {
  valorCentavos: number;
  categoriaId: string;
  formaPagamento: FormaPagamento;
  responsavel: Responsavel;
  descricao: string;
  dataISO: string;
  pago: boolean;
  observacao: string;
  parcelado: { totalParcelas: number; primeiraParcelaISO: string } | null;
}): Promise<Resultado> {
  const erro = validarComuns(dados);
  if (erro) return { ok: false, erro };

  const categoria = await prisma.categoria.findUnique({
    where: { id: dados.categoriaId },
  });
  if (!categoria) return { ok: false, erro: "Categoria não encontrada." };

  const descricao = dados.descricao.trim() || categoria.nome;
  const observacao = dados.observacao.trim() || null;

  if (dados.parcelado) {
    const { totalParcelas, primeiraParcelaISO } = dados.parcelado;
    if (!Number.isInteger(totalParcelas) || totalParcelas < 2 || totalParcelas > 120)
      return { ok: false, erro: "Número de parcelas deve ser entre 2 e 120." };
    const primeira = parseDataISO(primeiraParcelaISO);
    if (!primeira) return { ok: false, erro: "Data da 1ª parcela inválida." };

    await prisma.parcelamento.create({
      data: {
        descricao,
        valorParcelaCentavos: dados.valorCentavos,
        totalParcelas,
        primeiraAno: primeira.ano,
        primeiraMes: primeira.mes,
        diaVencimento: primeira.dia,
        formaPagamento: dados.formaPagamento,
        responsavel: dados.responsavel,
        observacao,
        categoriaId: categoria.id,
        parcelas: {
          create: Array.from({ length: totalParcelas }, (_, i) => {
            const comp = somarMeses(primeira.ano, primeira.mes, i);
            return {
              descricao,
              valorCentavos: dados.valorCentavos,
              data: dataDe(comp.ano, comp.mes, ajustarDia(comp.ano, comp.mes, primeira.dia)),
              anoRef: comp.ano,
              mesRef: comp.mes,
              tipo: "PARCELADO" as const,
              formaPagamento: dados.formaPagamento,
              pago: i === 0 ? dados.pago : false,
              responsavel: dados.responsavel,
              observacao,
              categoriaId: categoria.id,
              parcelaNumero: i + 1,
            };
          }),
        },
      },
    });
  } else {
    const d = parseDataISO(dados.dataISO)!;
    await prisma.transacao.create({
      data: {
        descricao,
        valorCentavos: dados.valorCentavos,
        data: dataDe(d.ano, d.mes, d.dia),
        anoRef: d.ano,
        mesRef: d.mes,
        tipo: "VARIAVEL",
        formaPagamento: dados.formaPagamento,
        pago: dados.pago,
        responsavel: dados.responsavel,
        observacao,
        categoriaId: categoria.id,
      },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarTransacao(
  id: string,
  dados: {
    descricao: string;
    valorCentavos: number;
    categoriaId: string;
    formaPagamento: FormaPagamento;
    responsavel: Responsavel;
    dataISO: string;
    pago: boolean;
    observacao: string;
  }
): Promise<Resultado> {
  const erro = validarComuns(dados);
  if (erro) return { ok: false, erro };
  if (!dados.descricao.trim()) return { ok: false, erro: "Informe uma descrição." };

  const d = parseDataISO(dados.dataISO)!;
  await prisma.transacao.update({
    where: { id },
    data: {
      descricao: dados.descricao.trim(),
      valorCentavos: dados.valorCentavos,
      data: dataDe(d.ano, d.mes, d.dia),
      anoRef: d.ano,
      mesRef: d.mes,
      categoriaId: dados.categoriaId,
      formaPagamento: dados.formaPagamento,
      responsavel: dados.responsavel,
      pago: dados.pago,
      observacao: dados.observacao.trim() || null,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function alternarPago(id: string): Promise<Resultado> {
  const t = await prisma.transacao.findUnique({ where: { id } });
  if (!t) return { ok: false, erro: "Lançamento não encontrado." };
  await prisma.transacao.update({ where: { id }, data: { pago: !t.pago } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Pausa/reativa uma ocorrência de gasto fixo apenas naquele mês. */
export async function alternarPausada(id: string): Promise<Resultado> {
  const t = await prisma.transacao.findUnique({ where: { id } });
  if (!t) return { ok: false, erro: "Lançamento não encontrado." };
  await prisma.transacao.update({ where: { id }, data: { pausada: !t.pausada } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Exclui um lançamento. Ocorrências de gasto fixo não são excluídas de
 * verdade (seriam regeradas automaticamente) — são pausadas no mês.
 */
export async function excluirTransacao(id: string): Promise<Resultado> {
  const t = await prisma.transacao.findUnique({ where: { id } });
  if (!t) return { ok: false, erro: "Lançamento não encontrado." };

  if (t.tipo === "FIXO" && t.gastoFixoId) {
    await prisma.transacao.update({ where: { id }, data: { pausada: true } });
  } else {
    await prisma.transacao.delete({ where: { id } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
