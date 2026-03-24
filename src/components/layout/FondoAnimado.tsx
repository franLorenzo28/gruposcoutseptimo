import { memo } from "react";

const BackgroundFX = memo(() => {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div className="dark:hidden absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-red-50/60" />
      <div className="dark:hidden absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,hsl(var(--primary)/0.08),transparent_42%)]" />
      <div className="dark:hidden absolute inset-0 bg-[radial-gradient(circle_at_86%_84%,hsl(45_85%_55%/0.10),transparent_46%)]" />

      <div className="hidden dark:block bg-blob h-72 w-72 bg-muted/40 -top-24 -right-16 float-slow" />
      <div className="hidden dark:block bg-blob h-64 w-64 bg-muted/40 -bottom-24 -left-10 drift-slow" />
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-scout-black/80 via-scout-black/64 to-scout-black/40" />
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-scout-black/55 via-transparent to-transparent" />
    </div>
  );
});

BackgroundFX.displayName = "BackgroundFX";

export default BackgroundFX;
