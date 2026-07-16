"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Resultado } from "@/server/transacoes";

type DadosCategoria = {
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
};

function validar(d: DadosCategoria): string | null {
  if (!d.nome.trim()) return "Informe o nome da categoria.";
  if (!/^#[0-9a-fA-F]{6}$/.test(d.cor)) return "Cor inválida.";
  return null;
}

export async function criarCategoria(dados: DadosCategoria): Promise<Resultado> {
  const erro = validar(dados);
  if (erro) return { ok: false, erro };

  const existente = await prisma.categoria.findUnique({
    where: { nome: dados.nome.trim() },
  });
  if (existente) return { ok: false, erro: "Já existe uma categoria com esse nome." };

  const max = await prisma.categoria.aggregate({ _max: { ordem: true } });
  await prisma.categoria.create({
    data: {
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      icone: dados.icone.trim() || "🏷️",
      cor: dados.cor,
      ordem: (max._max.ordem ?? 0) + 1,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarCategoria(
  id: string,
  dados: DadosCategoria
): Promise<Resultado> {
  const erro = validar(dados);
  if (erro) return { ok: false, erro };

  const existente = await prisma.categoria.findUnique({
    where: { nome: dados.nome.trim() },
  });
  if (existente && existente.id !== id)
    return { ok: false, erro: "Já existe uma categoria com esse nome." };

  await prisma.categoria.update({
    where: { id },
    data: {
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      icone: dados.icone.trim() || "🏷️",
      cor: dados.cor,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Desativa/reativa. Categorias desativadas somem do lançamento rápido, mas o histórico permanece. */
export async function alternarAtivaCategoria(id: string): Promise<Resultado> {
  const c = await prisma.categoria.findUnique({ where: { id } });
  if (!c) return { ok: false, erro: "Categoria não encontrada." };
  await prisma.categoria.update({ where: { id }, data: { ativa: !c.ativa } });
  revalidatePath("/", "layout");
  return { ok: true };
}
