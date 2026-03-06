import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Signal Atlas — AI Content Universe",
  description:
    "Interactive star-field visualization of the AI content ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050510] text-white antialiased">{children}</body>
    </html>
  );
}
