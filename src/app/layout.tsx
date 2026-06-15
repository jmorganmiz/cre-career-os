import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRE Career OS",
  description: "Your operating system for a career in commercial real estate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>
        <DataProvider><AppShell>{children}</AppShell></DataProvider>
      </body>
    </html>
  );
}
