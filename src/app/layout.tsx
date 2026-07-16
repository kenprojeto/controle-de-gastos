import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BarraNavegacao from "@/components/BarraNavegacao";
import RegistrarSW from "@/components/RegistrarSW";
import { ProvedorToast } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Controle de Gastos",
  description: "Finanças do casal — Dennis & Patrizzia",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Gastos",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <RegistrarSW />
        <ProvedorToast>
          <main className="mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-4">
            {children}
          </main>
          <BarraNavegacao />
        </ProvedorToast>
      </body>
    </html>
  );
}
