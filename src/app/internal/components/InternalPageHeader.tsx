import type { ReactNode } from "react";
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
    <header className="overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--card))_52%,hsla(var(--primary)/0.08)_100%)] p-5 shadow-[0_18px_50px_-24px_hsla(0,0%,0%,0.35)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary hover:bg-primary/10">
            {eyebrow}
          </Badge>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </header>
  );
}
