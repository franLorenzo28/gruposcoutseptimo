import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionBlock - Consistent spacing system for card sections
 * Provides mobile-first responsive spacing and visual hierarchy
 */

const SectionBlock = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "compact" | "spacious";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const baseClass = cn(
    "rounded-md border border-border/40 bg-muted/25 p-3 sm:p-4 transition-colors",
    {
      "space-y-2 sm:space-y-3": variant === "default",
      "space-y-1.5 sm:space-y-2": variant === "compact",
      "space-y-3 sm:space-y-4": variant === "spacious",
    },
    className
  );

  return <div ref={ref} className={baseClass} {...props} />;
});
SectionBlock.displayName = "SectionBlock";

const SectionBlockTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn("text-sm font-semibold text-foreground flex items-center gap-2", className)}
    {...props}
  />
));
SectionBlockTitle.displayName = "SectionBlockTitle";

const SectionBlockDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs sm:text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
SectionBlockDescription.displayName = "SectionBlockDescription";

export {
  SectionBlock,
  SectionBlockTitle,
  SectionBlockDescription,
};
