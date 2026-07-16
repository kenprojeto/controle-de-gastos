// Gera os ícones do PWA em public/icons a partir de um SVG.
// Uso: node scripts/gerar-icones.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "public", "icons");
mkdirSync(destino, { recursive: true });

function svgIcone({ margem }) {
  // margem maior = área de segurança para ícones "maskable"
  const r = 190 - margem;
  return Buffer.from(`
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="${margem > 0 ? 0 : 112}" fill="#020617"/>
      <circle cx="256" cy="256" r="${r}" fill="#10b981"/>
      <text x="256" y="${256 + (r * 0.36)}" font-size="${r * 1.05}" font-weight="bold"
        text-anchor="middle" fill="#022c22"
        font-family="Helvetica, Arial, sans-serif">R$</text>
    </svg>
  `);
}

const tarefas = [
  { arquivo: "icone-192.png", tamanho: 192, margem: 0 },
  { arquivo: "icone-512.png", tamanho: 512, margem: 0 },
  { arquivo: "icone-mascaravel-512.png", tamanho: 512, margem: 60 },
  { arquivo: "apple-touch-icon.png", tamanho: 180, margem: 0 },
];

for (const t of tarefas) {
  await sharp(svgIcone({ margem: t.margem }))
    .resize(t.tamanho, t.tamanho)
    .png()
    .toFile(join(destino, t.arquivo));
  console.log(`✓ ${t.arquivo}`);
}
