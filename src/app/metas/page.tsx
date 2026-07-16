import { prisma } from "@/lib/prisma";
import { hojeISO, hojeLocal } from "@/lib/datas";
import GerenciarMetas from "@/components/GerenciarMetas";

export const dynamic = "force-dynamic";

export default async function PaginaMetas() {
  const metas = await prisma.meta.findMany({
    include: {
      aportes: { orderBy: [{ data: "desc" }] },
      planos: true,
    },
    orderBy: { criadaEm: "asc" },
  });

  const hoje = hojeLocal();

  return (
    <GerenciarMetas
      metas={metas.map((m) => ({
        id: m.id,
        nome: m.nome,
        valorTotalCentavos: m.valorTotalCentavos,
        dataAlvoISO: m.dataAlvo ? m.dataAlvo.toISOString().slice(0, 10) : null,
        aportes: m.aportes.map((a) => ({
          id: a.id,
          dataISO: a.data.toISOString().slice(0, 10),
          valorCentavos: a.valorCentavos,
        })),
        planos: m.planos.map((p) => ({
          ano: p.anoRef,
          mes: p.mesRef,
          valorCentavos: p.valorCentavos,
        })),
      }))}
      hoje={hojeISO()}
      anoAtual={hoje.ano}
      mesAtual={hoje.mes}
    />
  );
}
