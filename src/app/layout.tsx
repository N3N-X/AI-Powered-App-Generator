import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rux.sh",
  description: "Generate desktop apps from plain English",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen text-white">
        {children}
      </body>
    </html>
  );
}
