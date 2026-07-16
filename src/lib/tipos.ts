import type { FormaPagamento, Responsavel, TipoTransacao } from "@/generated/prisma/enums";

export type CategoriaResumo = {
  id: string;
  nome: string;
  icone: string;
  cor: string;
};

export type TransacaoDTO = {
  id: string;
  descricao: string;
  valorCentavos: number;
  dataISO: string;
  tipo: TipoTransacao;
  formaPagamento: FormaPagamento;
  pago: boolean;
  pausada: boolean;
  responsavel: Responsavel;
  observacao: string | null;
  categoria: CategoriaResumo;
  parcelaNumero: number | null;
  totalParcelas: number | null;
  ehFixo: boolean;
};

export type EntradaDTO = {
  id: string;
  nome: string;
  valorCentavos: number;
  dataISO: string;
  responsavel: Responsavel;
  recorrente: boolean;
  pausada: boolean;
};
