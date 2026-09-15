import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const themeScript = `
  (() => {
    try {
      const saved = localStorage.getItem("click-nfe-theme");
      const dark = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    } catch {}
  })();
`;

export const metadata: Metadata = {
  title: {
    default: "Click NFe | DUIMP e NF-e em um só fluxo",
    template: "%s | Click NFe",
  },
  description:
    "Organize dados da DUIMP, valide informações fiscais e prepare a emissão de NF-e de importação com segurança.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
