import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-ink/10 bg-paper px-4 text-base text-ink outline-none placeholder:text-ink-soft/70 focus-visible:border-moss",
        className,
      )}
      {...props}
    />
  );
}
