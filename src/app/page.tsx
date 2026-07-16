import { prisma } from "@/lib/prisma";
import { hojeISO, hojeLocal } from "@/lib/datas";
import { garantirOcorrenciasDoMes } from "@/lib/recorrencias";
import LancamentoRapido from "@/components/LancamentoRapido";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const { ano, mes } = hojeLocal();
  await garantirOcorrenciasDoMes(ano, mes);

  const categorias = await prisma.categoria.findMany({
    where: { ativa: true },
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, icone: true, cor: true },
  });

  return <LancamentoRapido categorias={categorias} hoje={hojeISO()} />;
}
