import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Glossy deep-forest primary with inner highlight + warm shadow
        default:
          "bg-gloss-forest text-primary-foreground shadow-forest-button hover:bg-gloss-forest-hover hover:shadow-forest-button-hover active:scale-[0.98] active:shadow-paper-press",
        // Paper-like secondary — raised cream with subtle inner top-light
        secondary:
          "paper-shine border border-border bg-surface-raised text-foreground shadow-paper-raised hover:shadow-paper-hover active:scale-[0.98] active:shadow-paper-press",
        // Ghost — no bg until hover
        ghost:
          "text-ink-mid hover:bg-surface-sunken hover:text-foreground",
        // Outline — same as secondary but lighter
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-sunken/60",
        // Oak accent — warm, used sparingly
        accent:
          "bg-gloss-oak text-accent-foreground shadow-paper-raised hover:opacity-95 active:scale-[0.98]",
        // Destructive — muted brick
        destructive:
          "bg-destructive text-destructive-foreground shadow-paper-raised hover:opacity-90 active:scale-[0.98]",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
