import type { ReactNode } from "react";
import { Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InternalPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
}

export function InternalPageHeader({
  eyebrow,
  title,
  description,
  meta,
}: InternalPageHeaderProps) {
  return (
    <header className="surface-panel relative overflow-hidden rounded-[28px] p-5 sm:p-7 lg:p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[32px] border-primary/[0.045]" aria-hidden="true" />
      <Compass className="pointer-events-none absolute right-8 top-7 hidden h-20 w-20 rotate-12 text-foreground/[0.035] sm:block" aria-hidden="true" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary/10">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {eyebrow}
          </Badge>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-[2.65rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        </div>
        {meta ? <div className="shrink-0 rounded-2xl border border-border/60 bg-background/65 p-3 backdrop-blur-sm">{meta}</div> : null}
      </div>
    </header>
  );
}
