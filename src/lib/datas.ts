export const FUSO = "America/Sao_Paulo";

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function nomeMes(mes: number): string {
  return NOMES_MESES[mes - 1] ?? "?";
}

export function nomeMesCurto(mes: number): string {
  return nomeMes(mes).slice(0, 3);
}

/** Data de hoje no fuso de São Paulo, independente do fuso do servidor. */
export function hojeLocal(): { ano: number; mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [ano, mes, dia] = partes.split("-").map(Number);
  return { ano, mes, dia };
}

/** Constrói um DateTime estável (meio-dia UTC) para uma data de calendário. */
export function dataDe(ano: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, 12));
}

export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Ajusta o dia para caber no mês (ex.: dia 31 em fevereiro → 28/29). */
export function ajustarDia(ano: number, mes: number, dia: number): number {
  return Math.min(dia, ultimoDiaDoMes(ano, mes));
}

export function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

export function proximoMes(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

/** Soma n meses a uma competência (ano, mes). */
export function somarMeses(
  ano: number,
  mes: number,
  n: number
): { ano: number; mes: number } {
  const total = ano * 12 + (mes - 1) + n;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** Compara competências: negativo se a < b, 0 se iguais, positivo se a > b. */
export function compararCompetencia(
  aAno: number,
  aMes: number,
  bAno: number,
  bMes: number
): number {
  return aAno * 12 + aMes - (bAno * 12 + bMes);
}

/** "2026-07" → { ano: 2026, mes: 7 }; retorna null se inválido. */
export function parseChaveMes(chave: string | undefined): { ano: number; mes: number } | null {
  if (!chave) return null;
  const m = /^(\d{4})-(\d{1,2})$/.exec(chave);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return { ano, mes };
}

export function chaveMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/** "2026-07-15" → partes numéricas; retorna null se inválido. */
export function parseDataISO(
  iso: string
): { ano: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { ano, mes, dia };
}

export function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
}

export function formatarDataCompleta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

/** Data de hoje como string "YYYY-MM-DD" no fuso de São Paulo. */
export function hojeISO(): string {
  const { ano, mes, dia } = hojeLocal();
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
