"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hojeLocal } from "@/lib/datas";
import { garantirOcorrenciasDoMes } from "@/lib/recorrencias";
import type { FormaPagamento, Responsavel } from "@/generated/prisma/enums";
import type { Resultado } from "@/server/transacoes";

type DadosGastoFixo = {
  descricao: string;
  valorCentavos: number;
  diaDoMes: number;
  categoriaId: string;
  formaPagamento: FormaPagamento;
  responsavel: Responsavel;
};

function validarFixo(d: DadosGastoFixo): string | null {
  if (!d.descricao.trim()) return "Informe uma descrição.";
  if (!Number.isInteger(d.valorCentavos) || d.valorCentavos <= 0)
    return "Informe um valor maior que zero.";
  if (!Number.isInteger(d.diaDoMes) || d.diaDoMes < 1 || d.diaDoMes > 31)
    return "Dia do mês deve ser entre 1 e 31.";
  if (!d.categoriaId) return "Escolha uma categoria.";
  return null;
}

export async function criarGastoFixo(dados: DadosGastoFixo): Promise<Resultado> {
  const erro = validarFixo(dados);
  if (erro) return { ok: false, erro };

  const { ano, mes } = hojeLocal();
  await prisma.gastoFixo.create({
    data: {
      descricao: dados.descricao.trim(),
      valorCentavos: dados.valorCentavos,
      diaDoMes: dados.diaDoMes,
      categoriaId: dados.categoriaId,
      formaPagamento: dados.formaPagamento,
      responsavel: dados.responsavel,
      inicioAno: ano,
      inicioMes: mes,
    },
  });
  await garantirOcorrenciasDoMes(ano, mes);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarGastoFixo(
  id: string,
  dados: DadosGastoFixo,
  atualizarMesAtual: boolean
): Promise<Resultado> {
  const erro = validarFixo(dados);
  if (erro) return { ok: false, erro };

  await prisma.gastoFixo.update({
    where: { id },
    data: {
      descricao: dados.descricao.trim(),
      valorCentavos: dados.valorCentavos,
      diaDoMes: dados.diaDoMes,
      categoriaId: dados.categoriaId,
      formaPagamento: dados.formaPagamento,
      responsavel: dados.responsavel,
    },
  });

  if (atualizarMesAtual) {
    const { ano, mes } = hojeLocal();
    await prisma.transacao.updateMany({
      where: { gastoFixoId: id, anoRef: ano, mesRef: mes, pago: false },
      data: {
        descricao: dados.descricao.trim(),
        valorCentavos: dados.valorCentavos,
        categoriaId: dados.categoriaId,
        formaPagamento: dados.formaPagamento,
        responsavel: dados.responsavel,
      },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Desativa/reativa o gasto fixo (deixa de gerar ocorrências novas). */
export async function alternarAtivoGastoFixo(id: string): Promise<Resultado> {
  const g = await prisma.gastoFixo.findUnique({ where: { id } });
  if (!g) return { ok: false, erro: "Gasto fixo não encontrado." };
  await prisma.gastoFixo.update({ where: { id }, data: { ativo: !g.ativo } });

  if (g.ativo) {
    // Ao desativar, remove a ocorrência do mês atual se ainda não foi paga
    const { ano, mes } = hojeLocal();
    await prisma.transacao.deleteMany({
      where: { gastoFixoId: id, anoRef: ano, mesRef: mes, pago: false },
    });
  } else {
    const { ano, mes } = hojeLocal();
    await garantirOcorrenciasDoMes(ano, mes);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Exclui o modelo. O histórico de meses anteriores é preservado. */
export async function excluirGastoFixo(id: string): Promise<Resultado> {
  const { ano, mes } = hojeLocal();
  // Remove a ocorrência não paga do mês atual antes de soltar o vínculo
  await prisma.transacao.deleteMany({
    where: { gastoFixoId: id, anoRef: ano, mesRef: mes, pago: false },
  });
  await prisma.gastoFixo.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

type DadosReceita = {
  nome: string;
  valorCentavos: number;
  diaDoMes: number;
  responsavel: Responsavel;
};

function validarReceita(d: DadosReceita): string | null {
  if (!d.nome.trim()) return "Informe o nome da receita.";
  if (!Number.isInteger(d.valorCentavos) || d.valorCentavos <= 0)
    return "Informe um valor maior que zero.";
  if (!Number.isInteger(d.diaDoMes) || d.diaDoMes < 1 || d.diaDoMes > 31)
    return "Dia do mês deve ser entre 1 e 31.";
  return null;
}

export async function criarReceitaRecorrente(dados: DadosReceita): Promise<Resultado> {
  const erro = validarReceita(dados);
  if (erro) return { ok: false, erro };

  const { ano, mes } = hojeLocal();
  await prisma.receitaRecorrente.create({
    data: {
      nome: dados.nome.trim(),
      valorCentavos: dados.valorCentavos,
      diaDoMes: dados.diaDoMes,
      responsavel: dados.responsavel,
      inicioAno: ano,
      inicioMes: mes,
    },
  });
  await garantirOcorrenciasDoMes(ano, mes);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarReceitaRecorrente(
  id: string,
  dados: DadosReceita,
  atualizarMesAtual: boolean
): Promise<Resultado> {
  const erro = validarReceita(dados);
  if (erro) return { ok: false, erro };

  await prisma.receitaRecorrente.update({
    where: { id },
    data: {
      nome: dados.nome.trim(),
      valorCentavos: dados.valorCentavos,
      diaDoMes: dados.diaDoMes,
      responsavel: dados.responsavel,
    },
  });

  if (atualizarMesAtual) {
    const { ano, mes } = hojeLocal();
    await prisma.entrada.updateMany({
      where: { receitaRecorrenteId: id, anoRef: ano, mesRef: mes },
      data: {
        nome: dados.nome.trim(),
        valorCentavos: dados.valorCentavos,
        responsavel: dados.responsavel,
      },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function alternarAtivaReceita(id: string): Promise<Resultado> {
  const r = await prisma.receitaRecorrente.findUnique({ where: { id } });
  if (!r) return { ok: false, erro: "Receita não encontrada." };
  await prisma.receitaRecorrente.update({ where: { id }, data: { ativo: !r.ativo } });

  const { ano, mes } = hojeLocal();
  if (r.ativo) {
    await prisma.entrada.deleteMany({
      where: { receitaRecorrenteId: id, anoRef: ano, mesRef: mes },
    });
  } else {
    await garantirOcorrenciasDoMes(ano, mes);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirReceitaRecorrente(id: string): Promise<Resultado> {
  const { ano, mes } = hojeLocal();
  await prisma.entrada.deleteMany({
    where: { receitaRecorrenteId: id, anoRef: ano, mesRef: mes },
  });
  await prisma.receitaRecorrente.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}
