import { prisma } from "@/lib/prisma";
import GerenciarRecorrentes from "@/components/GerenciarRecorrentes";

export const dynamic = "force-dynamic";

export default async function PaginaRecorrentes() {
  const [fixos, receitas, categorias] = await Promise.all([
    prisma.gastoFixo.findMany({
      include: {
        categoria: { select: { id: true, nome: true, icone: true, cor: true } },
      },
      orderBy: [{ ativo: "desc" }, { diaDoMes: "asc" }],
    }),
    prisma.receitaRecorrente.findMany({
      orderBy: [{ ativo: "desc" }, { diaDoMes: "asc" }],
    }),
    prisma.categoria.findMany({
      where: { ativa: true },
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true, icone: true, cor: true },
    }),
  ]);

  return (
    <GerenciarRecorrentes
      fixos={fixos.map((f) => ({
        id: f.id,
        descricao: f.descricao,
        valorCentavos: f.valorCentavos,
        diaDoMes: f.diaDoMes,
        categoria: f.categoria,
        formaPagamento: f.formaPagamento,
        responsavel: f.responsavel,
        ativo: f.ativo,
      }))}
      receitas={receitas.map((r) => ({
        id: r.id,
        nome: r.nome,
        valorCentavos: r.valorCentavos,
        diaDoMes: r.diaDoMes,
        responsavel: r.responsavel,
        ativo: r.ativo,
      }))}
      categorias={categorias}
    />
  );
}
