import { prisma } from "@/lib/prisma";
import GerenciarCategorias from "@/components/GerenciarCategorias";

export const dynamic = "force-dynamic";

export default async function PaginaCategorias() {
  const categorias = await prisma.categoria.findMany({
    orderBy: [{ ativa: "desc" }, { ordem: "asc" }],
  });

  return (
    <GerenciarCategorias
      categorias={categorias.map((c) => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        icone: c.icone,
        cor: c.cor,
        ativa: c.ativa,
      }))}
    />
  );
}
