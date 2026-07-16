"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dataDe, parseDataISO } from "@/lib/datas";
import type { Resultado } from "@/server/transacoes";

export async function criarMeta(dados: {
  nome: string;
  valorTotalCentavos: number;
  dataAlvoISO: string | null;
}): Promise<Resultado> {
  if (!dados.nome.trim()) return { ok: false, erro: "Informe o nome da meta." };
  if (!Number.isInteger(dados.valorTotalCentavos) || dados.valorTotalCentavos <= 0)
    return { ok: false, erro: "Informe o valor total da meta." };

  let dataAlvo: Date | null = null;
  if (dados.dataAlvoISO) {
    const d = parseDataISO(dados.dataAlvoISO);
    if (!d) return { ok: false, erro: "Data alvo inválida." };
    dataAlvo = dataDe(d.ano, d.mes, d.dia);
  }

  await prisma.meta.create({
    data: {
      nome: dados.nome.trim(),
      valorTotalCentavos: dados.valorTotalCentavos,
      dataAlvo,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarMeta(
  id: string,
  dados: { nome: string; valorTotalCentavos: number; dataAlvoISO: string | null }
): Promise<Resultado> {
  if (!dados.nome.trim()) return { ok: false, erro: "Informe o nome da meta." };
  if (!Number.isInteger(dados.valorTotalCentavos) || dados.valorTotalCentavos <= 0)
    return { ok: false, erro: "Informe o valor total da meta." };

  let dataAlvo: Date | null = null;
  if (dados.dataAlvoISO) {
    const d = parseDataISO(dados.dataAlvoISO);
    if (!d) return { ok: false, erro: "Data alvo inválida." };
    dataAlvo = dataDe(d.ano, d.mes, d.dia);
  }

  await prisma.meta.update({
    where: { id },
    data: {
      nome: dados.nome.trim(),
      valorTotalCentavos: dados.valorTotalCentavos,
      dataAlvo,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirMeta(id: string): Promise<Resultado> {
  await prisma.meta.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function criarAporte(
  metaId: string,
  dados: { valorCentavos: number; dataISO: string }
): Promise<Resultado> {
  if (!Number.isInteger(dados.valorCentavos) || dados.valorCentavos <= 0)
    return { ok: false, erro: "Informe um valor maior que zero." };
  const d = parseDataISO(dados.dataISO);
  if (!d) return { ok: false, erro: "Data inválida." };

  await prisma.metaAporte.create({
    data: {
      metaId,
      valorCentavos: dados.valorCentavos,
      data: dataDe(d.ano, d.mes, d.dia),
      anoRef: d.ano,
      mesRef: d.mes,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirAporte(id: string): Promise<Resultado> {
  await prisma.metaAporte.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Define (ou zera) o valor planejado de uma meta em uma competência. */
export async function definirPlanoMensal(
  metaId: string,
  ano: number,
  mes: number,
  valorCentavos: number
): Promise<Resultado> {
  if (!Number.isInteger(valorCentavos) || valorCentavos < 0)
    return { ok: false, erro: "Valor inválido." };

  if (valorCentavos === 0) {
    await prisma.metaPlanoMensal.deleteMany({
      where: { metaId, anoRef: ano, mesRef: mes },
    });
  } else {
    await prisma.metaPlanoMensal.upsert({
      where: { metaId_anoRef_mesRef: { metaId, anoRef: ano, mesRef: mes } },
      update: { valorCentavos },
      create: { metaId, anoRef: ano, mesRef: mes, valorCentavos },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
