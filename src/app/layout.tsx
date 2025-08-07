import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "豪德茶業 Haude Tea - 傳承百年茶文化",
  description: "豪德茶業創立於1862年，專營紅肉李果園、精品咖啡等優質農產品，致力於傳承百年農業文化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}