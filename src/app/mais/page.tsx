import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  FileUp,
  PiggyBank,
  Repeat,
  Tags,
  Target,
} from "lucide-react";

const itens = [
  {
    href: "/recorrentes",
    titulo: "Fixos e recorrentes",
    descricao: "Aluguel, assinaturas, salários — repetem todo mês",
    Icone: Repeat,
  },
  {
    href: "/panorama",
    titulo: "Panorama anual",
    descricao: "Entradas × gastos mês a mês",
    Icone: CalendarDays,
  },
  {
    href: "/metas",
    titulo: "Metas financeiras",
    descricao: "Objetivos e progresso dos aportes",
    Icone: Target,
  },
  {
    href: "/investimentos",
    titulo: "Investimentos",
    descricao: "Reserva, renda fixa e variável por mês",
    Icone: PiggyBank,
  },
  {
    href: "/categorias",
    titulo: "Categorias",
    descricao: "Editar, criar e desativar categorias",
    Icone: Tags,
  },
  {
    href: "/importar",
    titulo: "Importar da planilha",
    descricao: "Trazer o histórico do Google Sheets (CSV)",
    Icone: FileUp,
  },
];

export default function PaginaMais() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold">Mais</h1>
        <p className="text-xs text-slate-500">Configurações e outras telas</p>
      </header>

      <nav className="flex flex-col gap-2">
        {itens.map(({ href, titulo, descricao, Icone }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
              <Icone size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{titulo}</span>
              <span className="block truncate text-xs text-slate-500">{descricao}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-slate-600" />
          </Link>
        ))}
      </nav>

      <p className="text-center text-xs text-slate-600">
        Controle de Gastos · Dennis & Patrizzia
      </p>
    </div>
  );
}
