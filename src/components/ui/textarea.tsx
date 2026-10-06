import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-ink-soft/70 focus-visible:border-moss",
        className,
      )}
      {...props}
    />
  );
}
