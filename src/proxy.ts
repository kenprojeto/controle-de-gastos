import { NextResponse, type NextRequest } from "next/server";

async function sha256Hex(texto: string): Promise<string> {
  const dados = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Proteção por PIN: se APP_PIN estiver definido, exige o cookie de
 * acesso (hash do PIN) e redireciona para /pin caso contrário.
 */
export default async function proxy(req: NextRequest) {
  const pin = process.env.APP_PIN;
  if (!pin) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/pin") return NextResponse.next();

  const esperado = await sha256Hex(`${pin}:controle-de-gastos`);
  if (req.cookies.get("acesso")?.value === esperado) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/pin";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|icons/|favicon\\.ico|sw\\.js|manifest\\.webmanifest).*)"],
};
