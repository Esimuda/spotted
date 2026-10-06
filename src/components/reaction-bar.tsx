"use client";

import { Eye, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactionKind, ReactionSummary } from "@/lib/types";

const ITEMS: { kind: ReactionKind; label: string; icon: typeof Sparkles }[] = [
  { kind: "wonder", label: "Wonder", icon: Sparkles },
  { kind: "seen", label: "Seen it", icon: Eye },
  { kind: "protect", label: "Protect", icon: Shield },
];

export function ReactionBar({
  reactions,
  onReact,
}: {
  reactions: ReactionSummary;
  onReact: (kind: ReactionKind) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ITEMS.map((item) => {
        const active = reactions.mine === item.kind;
        const Icon = item.icon;
        return (
          <button
            key={item.kind}
            type="button"
            aria-pressed={active}
            onClick={() => onReact(item.kind)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition",
              active ? "bg-moss text-cream" : "bg-cream-deep text-ink hover:bg-cream",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
            <span className={active ? "text-gold" : "text-ink-soft"}>{reactions[item.kind]}</span>
          </button>
        );
      })}
    </div>
  );
}
