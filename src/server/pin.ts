"use server";

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function verificarPin(pin: string): Promise<{ ok: boolean; erro?: string }> {
  const correto = process.env.APP_PIN;
  if (!correto) redirect("/");

  if (pin !== correto) return { ok: false, erro: "PIN incorreto." };

  const hash = createHash("sha256").update(`${correto}:controle-de-gastos`).digest("hex");
  const jarra = await cookies();
  jarra.set("acesso", hash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/");
}
