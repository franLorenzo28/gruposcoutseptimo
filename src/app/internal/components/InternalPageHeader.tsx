import type { ReactNode } from "react";
interface InternalPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
}
export function InternalPageHeader({ eyebrow, title, description, meta }: InternalPageHeaderProps) {
  return <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
    {meta && <div className="shrink-0">{meta}</div>}
  </header>;
}

