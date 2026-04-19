import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata = {
  title: "Veli Toplantısı Randevu Sistemi",
  description:
    "Yasir Karaman - Veli toplantısı için online randevu alma sistemi",
  keywords: "veli toplantısı, randevu, okul, öğretmen",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
