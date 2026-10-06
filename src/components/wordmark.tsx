import { APP_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo-mark";

export function Wordmark({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[1.65rem] leading-none tracking-tight", light ? "text-cream" : "text-moss", className)}>
      <LogoMark className="h-8 w-8" />
      {APP_NAME}
    </span>
  );
}
