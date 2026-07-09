import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Factory TV Notice",
  description: "Bảng thông báo TV nội bộ cho xưởng sản xuất"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
