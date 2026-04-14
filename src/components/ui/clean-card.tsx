import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CleanCard - Modern card component inspired by Instagram design
 * Features: Consistent spacing, subtle shadows, clean borders with transparency
 */

const CleanCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border/50 bg-card/60 shadow-sm backdrop-blur-xs transition-all duration-200 hover:shadow-md hover:border-border/70",
      className
    )}
    {...props}
  />
));
CleanCard.displayName = "CleanCard";

const CleanCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-5", className)}
    {...props}
  />
));
CleanCardHeader.displayName = "CleanCardHeader";

const CleanCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-base sm:text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CleanCardTitle.displayName = "CleanCardTitle";

const CleanCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs sm:text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CleanCardDescription.displayName = "CleanCardDescription";

const CleanCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-5 pt-0 space-y-4", className)} {...props} />
));
CleanCardContent.displayName = "CleanCardContent";

const CleanCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-5 pt-0", className)}
    {...props}
  />
));
CleanCardFooter.displayName = "CleanCardFooter";

export {
  CleanCard,
  CleanCardHeader,
  CleanCardTitle,
  CleanCardDescription,
  CleanCardContent,
  CleanCardFooter,
};
