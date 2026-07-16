import type {
  FormaPagamento,
  Responsavel,
  TipoTransacao,
} from "@/generated/prisma/enums";

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string; icone: string }[] = [
  { valor: "PIX", rotulo: "Pix", icone: "⚡" },
  { valor: "DEBITO", rotulo: "Débito", icone: "💳" },
  { valor: "CREDITO", rotulo: "Crédito", icone: "💰" },
  { valor: "DINHEIRO", rotulo: "Dinheiro", icone: "💵" },
  { valor: "OUTRO", rotulo: "Outro", icone: "❔" },
];

export const RESPONSAVEIS: { valor: Responsavel; rotulo: string }[] = [
  { valor: "CASAL", rotulo: "Casal" },
  { valor: "DENNIS", rotulo: "Dennis" },
  { valor: "PATRIZZIA", rotulo: "Patrizzia" },
];

export function rotuloFormaPagamento(fp: FormaPagamento): string {
  return FORMAS_PAGAMENTO.find((f) => f.valor === fp)?.rotulo ?? fp;
}

export function rotuloResponsavel(r: Responsavel): string {
  return RESPONSAVEIS.find((x) => x.valor === r)?.rotulo ?? r;
}

export function rotuloTipo(t: TipoTransacao): string {
  return t === "FIXO" ? "Fixo" : t === "PARCELADO" ? "Parcelado" : "Variável";
}
