import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Special_Elite } from "next/font/google";
import { Toaster } from "sonner";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const display = Special_Elite({ weight: "400", subsets: ["latin"], variable: "--font-special-elite" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "The Midnight Heist | A SQL Detective Quiz",
  description: "Solve a museum theft with SQL against a live Postgres database.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="grain min-h-screen">
        <NavBar />
        <main>{children}</main>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{ style: { background: "#15130f", border: "1px solid #2e2a22", color: "#ebe2cc" } }}
        />
      </body>
    </html>
  );
}
