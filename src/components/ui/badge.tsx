import { cn } from "@/lib/utils";
import type { Iucn } from "@/data/species";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-cream-deep px-2.5 py-1 text-xs font-semibold", className)}
      {...props}
    />
  );
}

const STATUS_CLASS: Record<Iucn, string> = {
  LC: "bg-moss/10 text-moss",
  NT: "bg-gold/25 text-clay-deep",
  VU: "bg-clay/15 text-clay-deep",
  EN: "bg-clay text-paper",
  CR: "bg-dusk text-gold",
  DD: "bg-cream-deep text-ink-soft",
  NE: "bg-cream-deep text-ink-soft",
};

export function StatusBadge({ status, label }: { status: Iucn; label: string }) {
  return <Badge className={STATUS_CLASS[status]}>{label}</Badge>;
}
