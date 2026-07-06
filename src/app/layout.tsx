import type { Metadata } from "next";
import { AppShell } from "./_components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "مدیریت واحد بهبود عملیات و برنامه ریزی",
  description: "داشبورد مدیریت پروژه، گزارش و برنامه ریزی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/misc/Farsi-Digits/Vazirmatn-FD-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
