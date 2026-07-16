"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, PieChart, CalendarRange, Menu } from "lucide-react";

const itens = [
  { href: "/", rotulo: "Lançar", Icone: Plus },
  { href: "/resumo", rotulo: "Resumo", Icone: PieChart },
  { href: "/parcelas", rotulo: "Parcelas", Icone: CalendarRange },
  { href: "/mais", rotulo: "Mais", Icone: Menu },
];

export default function BarraNavegacao() {
  const rota = usePathname();
  if (rota === "/pin") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {itens.map(({ href, rotulo, Icone }) => {
          const ativo = href === "/" ? rota === "/" : rota.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                ativo ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              <Icone size={22} strokeWidth={ativo ? 2.4 : 2} />
              {rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
