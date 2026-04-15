import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Veli Toplantısı Randevu Sistemi",
  description:
    "Yasir Karaman - Veli toplantısı için online randevu alma sistemi",
  keywords: "veli toplantısı, randevu, okul, öğretmen",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
