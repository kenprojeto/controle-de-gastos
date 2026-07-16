"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dataDe, parseDataISO } from "@/lib/datas";
import type { Responsavel } from "@/generated/prisma/enums";
import type { Resultado } from "@/server/transacoes";

function validar(dados: { nome: string; valorCentavos: number; dataISO: string }): string | null {
  if (!dados.nome.trim()) return "Informe o nome/origem da entrada.";
  if (!Number.isInteger(dados.valorCentavos) || dados.valorCentavos <= 0)
    return "Informe um valor maior que zero.";
  if (!parseDataISO(dados.dataISO)) return "Data inválida.";
  return null;
}

export async function criarEntrada(dados: {
  nome: string;
  valorCentavos: number;
  dataISO: string;
  responsavel: Responsavel;
}): Promise<Resultado> {
  const erro = validar(dados);
  if (erro) return { ok: false, erro };

  const d = parseDataISO(dados.dataISO)!;
  await prisma.entrada.create({
    data: {
      nome: dados.nome.trim(),
      valorCentavos: dados.valorCentavos,
      data: dataDe(d.ano, d.mes, d.dia),
      anoRef: d.ano,
      mesRef: d.mes,
      responsavel: dados.responsavel,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarEntrada(
  id: string,
  dados: {
    nome: string;
    valorCentavos: number;
    dataISO: string;
    responsavel: Responsavel;
  }
): Promise<Resultado> {
  const erro = validar(dados);
  if (erro) return { ok: false, erro };

  const d = parseDataISO(dados.dataISO)!;
  await prisma.entrada.update({
    where: { id },
    data: {
      nome: dados.nome.trim(),
      valorCentavos: dados.valorCentavos,
      data: dataDe(d.ano, d.mes, d.dia),
      anoRef: d.ano,
      mesRef: d.mes,
      responsavel: dados.responsavel,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Exclui uma entrada. Ocorrências de receita recorrente são pausadas
 * no mês (seriam regeradas automaticamente se excluídas).
 */
export async function excluirEntrada(id: string): Promise<Resultado> {
  const e = await prisma.entrada.findUnique({ where: { id } });
  if (!e) return { ok: false, erro: "Entrada não encontrada." };

  if (e.receitaRecorrenteId) {
    await prisma.entrada.update({ where: { id }, data: { pausada: true } });
  } else {
    await prisma.entrada.delete({ where: { id } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function alternarPausadaEntrada(id: string): Promise<Resultado> {
  const e = await prisma.entrada.findUnique({ where: { id } });
  if (!e) return { ok: false, erro: "Entrada não encontrada." };
  await prisma.entrada.update({ where: { id }, data: { pausada: !e.pausada } });
  revalidatePath("/", "layout");
  return { ok: true };
}
