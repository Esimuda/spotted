"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Camera, Map, Trees } from "lucide-react";
import { APP_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";
import { useTrail } from "@/components/trail-provider";
import { Wordmark } from "@/components/wordmark";

const LINKS = [
  { href: "/field", label: "Field", icon: Camera },
  { href: "/feed", label: "Trail", icon: Trees },
  { href: "/map", label: "Map", icon: Map },
  { href: "/life", label: "Life list", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { online, loadError } = useTrail();
  const inApp = LINKS.some((link) => pathname.startsWith(link.href)) || pathname.startsWith("/s/");

  if (!inApp) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-cream/85 px-4 py-3 backdrop-blur">
        <Link href="/" aria-label={`${APP_NAME} home`}>
          <Wordmark />
        </Link>
        <p className="text-xs font-semibold text-ink-soft">{online ? "Online" : "Offline"}</p>
      </header>
      {loadError ? (
        <p className="mx-4 rounded-2xl bg-gold/20 px-4 py-3 text-sm text-ink">{loadError} Notes on this phone are still here.</p>
      ) : null}
      <div className="pb-nav">{children}</div>
      <nav className="app-nav fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur" aria-label="Main">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold",
                    active ? "text-moss" : "text-ink-soft",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
