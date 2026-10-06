import { cn } from "@/lib/utils";

/** Scope and spot. The same geometry is rasterized for the PWA icons. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#1e4a38" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#e0a84a" strokeWidth="3.5" />
      <path
        d="M32 15.5v8M32 40.5v8M15.5 32h8M40.5 32h8"
        stroke="#f3eee4"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="5.2" fill="#c4622d" />
    </svg>
  );
}
