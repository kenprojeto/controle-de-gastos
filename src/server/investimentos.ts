"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Resultado } from "@/server/transacoes";

export async function salvarInvestimento(dados: {
  ano: number;
  mes: number;
  reservaCentavos: number;
  rendaFixaCentavos: number;
  rendaVariavelCentavos: number;
}): Promise<Resultado> {
  const { ano, mes, reservaCentavos, rendaFixaCentavos, rendaVariavelCentavos } = dados;
  if (mes < 1 || mes > 12) return { ok: false, erro: "Mês inválido." };
  for (const v of [reservaCentavos, rendaFixaCentavos, rendaVariavelCentavos]) {
    if (!Number.isInteger(v) || v < 0) return { ok: false, erro: "Valores inválidos." };
  }

  await prisma.investimento.upsert({
    where: { anoRef_mesRef: { anoRef: ano, mesRef: mes } },
    update: { reservaCentavos, rendaFixaCentavos, rendaVariavelCentavos },
    create: {
      anoRef: ano,
      mesRef: mes,
      reservaCentavos,
      rendaFixaCentavos,
      rendaVariavelCentavos,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirInvestimento(id: string): Promise<Resultado> {
  await prisma.investimento.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}
