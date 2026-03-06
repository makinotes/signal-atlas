"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ATLAS" },
  { href: "/sources", label: "SOURCES" },
  { href: "/trends", label: "TRENDS" },
  { href: "/compare", label: "COMPARE" },
  { href: "/archive", label: "ARCHIVE" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-1 px-6 py-4 bg-[#050510]/80 backdrop-blur-md border-b border-white/5">
      <Link href="/" className="text-[10px] tracking-[3px] uppercase text-white/50 mr-6">
        Signal Atlas
      </Link>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-1 text-[10px] tracking-[2px] uppercase rounded-full transition-all ${
            pathname === link.href
              ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/30"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
