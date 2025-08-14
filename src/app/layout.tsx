import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ToastProvider } from "@/components/Toast";
import VisitorTracker from "@/components/VisitorTracker";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-noto-serif-tc",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "豪德農場 Haude Farm - 嘉義梅山優質農產",
  description: "座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${notoSansTC.variable} ${notoSerifTC.variable} ${inter.variable} antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <VisitorTracker>
                <Header />
                {children}
              </VisitorTracker>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}