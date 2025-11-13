// app/layout.tsx
import React from "react";

export const metadata = {
  title: "ASTRO backend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
