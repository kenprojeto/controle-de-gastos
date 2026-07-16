"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Resultado } from "@/server/transacoes";

/** Exclui a compra parcelada inteira (todas as parcelas, passadas e futuras). */
export async function excluirParcelamento(id: string): Promise<Resultado> {
  await prisma.parcelamento.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marca como pagas todas as parcelas até a competência informada (quitação antecipada não — apenas registro). */
export async function marcarParcelasPagasAte(
  id: string,
  ano: number,
  mes: number
): Promise<Resultado> {
  await prisma.transacao.updateMany({
    where: {
      parcelamentoId: id,
      OR: [{ anoRef: { lt: ano } }, { anoRef: ano, mesRef: { lte: mes } }],
    },
    data: { pago: true },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
