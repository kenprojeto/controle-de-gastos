import { prisma } from "@/lib/prisma";
import { ajustarDia, compararCompetencia, dataDe } from "@/lib/datas";

/**
 * Garante que as ocorrências de gastos fixos e receitas recorrentes
 * existam para a competência (ano, mes). É idempotente: usa
 * createMany + skipDuplicates apoiado nos índices únicos
 * (gastoFixoId, anoRef, mesRef) e (receitaRecorrenteId, anoRef, mesRef).
 *
 * Chamada ao carregar qualquer tela que mostre dados do mês — assim os
 * fixos "nascem" sozinhos em cada mês novo, sem recadastro.
 */
export async function garantirOcorrenciasDoMes(ano: number, mes: number) {
  const [fixos, receitas] = await Promise.all([
    prisma.gastoFixo.findMany({ where: { ativo: true } }),
    prisma.receitaRecorrente.findMany({ where: { ativo: true } }),
  ]);

  const fixosAplicaveis = fixos.filter(
    (f) => compararCompetencia(f.inicioAno, f.inicioMes, ano, mes) <= 0
  );
  const receitasAplicaveis = receitas.filter(
    (r) => compararCompetencia(r.inicioAno, r.inicioMes, ano, mes) <= 0
  );

  await Promise.all([
    fixosAplicaveis.length
      ? prisma.transacao.createMany({
          data: fixosAplicaveis.map((f) => ({
            descricao: f.descricao,
            valorCentavos: f.valorCentavos,
            data: dataDe(ano, mes, ajustarDia(ano, mes, f.diaDoMes)),
            anoRef: ano,
            mesRef: mes,
            tipo: "FIXO" as const,
            formaPagamento: f.formaPagamento,
            pago: false,
            responsavel: f.responsavel,
            categoriaId: f.categoriaId,
            gastoFixoId: f.id,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    receitasAplicaveis.length
      ? prisma.entrada.createMany({
          data: receitasAplicaveis.map((r) => ({
            nome: r.nome,
            valorCentavos: r.valorCentavos,
            data: dataDe(ano, mes, ajustarDia(ano, mes, r.diaDoMes)),
            anoRef: ano,
            mesRef: mes,
            responsavel: r.responsavel,
            recebida: true,
            receitaRecorrenteId: r.id,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
  ]);
}
