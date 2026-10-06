import { APP_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";

export function Wordmark({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[1.65rem] leading-none tracking-tight", light ? "text-cream" : "text-moss", className)}>
      <span className="inline-block h-3 w-3 rounded-full bg-gold" aria-hidden />
      {APP_NAME}
    </span>
  );
}
