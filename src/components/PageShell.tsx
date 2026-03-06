"use client";
import { Nav } from "./Nav";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <Nav />
      <main className="pt-16 px-6 pb-12 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
