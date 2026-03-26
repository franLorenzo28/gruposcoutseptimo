import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:translate-y-px active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border border-transparent shadow-[0_8px_20px_hsla(0,100%,50%,0.3)] hover:bg-primary/92 hover:shadow-[0_12px_32px_hsla(0,100%,50%,0.42)] hover:scale-105",
        default:
          "bg-primary text-primary-foreground border border-transparent shadow-[0_10px_24px_hsla(0,85%,50%,0.28)] hover:bg-primary/92 hover:shadow-[0_12px_28px_hsla(0,85%,50%,0.35)]",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive/70 shadow-[0_8px_20px_hsla(0,75%,35%,0.35)] hover:bg-destructive/90",
        outline:
          "border border-border/70 bg-surface/85 text-foreground shadow-sm hover:bg-surface/80 hover:border-primary/60 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary/55 shadow-[0_8px_18px_hsla(45,92%,54%,0.25)] hover:bg-secondary/92 hover:shadow-[0_10px_24px_hsla(45,92%,54%,0.32)] hover:scale-105",
        ghost: "hover:bg-surface/70 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl font-semibold",
        heroSecondary:
          "bg-accent text-accent-foreground hover:opacity-90 shadow-lg hover:shadow-xl font-semibold",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-10 rounded-md px-4",
        lg: "h-12 rounded-lg px-9",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
