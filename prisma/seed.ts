import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categorias = [
  { nome: "Mercado", icone: "🛒", cor: "#22c55e", descricao: "Compras de supermercado e feira" },
  { nome: "Necessidades", icone: "🧴", cor: "#0ea5e9", descricao: "Itens essenciais do dia a dia (higiene, limpeza, farmácia básica)" },
  { nome: "Eletrônicos", icone: "📱", cor: "#6366f1", descricao: "Aparelhos, acessórios e gadgets" },
  { nome: "Assinaturas", icone: "📺", cor: "#8b5cf6", descricao: "Streaming, apps e serviços recorrentes" },
  { nome: "Roupa", icone: "👕", cor: "#ec4899", descricao: "Roupas, calçados e acessórios" },
  { nome: "Móveis/Beleza", icone: "🛋️", cor: "#a855f7", descricao: "Casa, decoração, móveis e cuidados pessoais" },
  { nome: "Presentes", icone: "🎁", cor: "#f43f5e", descricao: "Presentes para outras pessoas" },
  { nome: "Saúde", icone: "💊", cor: "#10b981", descricao: "Consultas, exames, remédios e plano de saúde" },
  { nome: "Despesas eventuais", icone: "🧾", cor: "#f97316", descricao: "Gastos pontuais que não se encaixam nas demais" },
  { nome: "Desenvolvimento pessoal", icone: "📚", cor: "#14b8a6", descricao: "Cursos, livros e estudos" },
  { nome: "Uber/Transporte", icone: "🚗", cor: "#eab308", descricao: "Uber, ônibus, combustível e transporte em geral" },
  { nome: "IFood/Restaurante", icone: "🍔", cor: "#ef4444", descricao: "Delivery e refeições fora de casa" },
  { nome: "Lazer", icone: "🎉", cor: "#06b6d4", descricao: "Passeios, cinema, viagens e diversão" },
  { nome: "Moradia", icone: "🏠", cor: "#3b82f6", descricao: "Aluguel, condomínio, luz, água, internet" },
  { nome: "Outro", icone: "❓", cor: "#94a3b8", descricao: "Tudo que não se encaixa nas outras categorias" },
];

async function main() {
  for (const [i, cat] of categorias.entries()) {
    await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: { ...cat, ordem: i },
    });
  }
  console.log(`Seed concluído: ${categorias.length} categorias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
