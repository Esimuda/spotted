import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-moss text-cream hover:bg-moss-mid px-5 py-3",
        clay: "bg-clay text-paper hover:bg-clay-deep px-5 py-3",
        ghost: "bg-transparent text-inherit hover:bg-ink/5 px-4 py-2",
        paper: "bg-paper text-ink hover:bg-cream px-5 py-3 shadow-sm",
        outline: "border border-ink/15 bg-transparent text-ink hover:bg-paper px-4 py-2",
      },
      size: {
        default: "h-12",
        sm: "h-9 px-3 text-xs",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}
