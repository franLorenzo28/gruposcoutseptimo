import { memo } from "react";

const BackgroundFX = memo(() => {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Grid background (light) */}
      <div
        className="absolute inset-0 opacity-[0.12] dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.35) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Grid background (dark) */}
      <div
        className="absolute inset-0 opacity-[0.12] hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
});

BackgroundFX.displayName = "BackgroundFX";

export default BackgroundFX;
