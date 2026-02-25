import { memo } from "react";

const BackgroundFX = memo(() => {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Grid background (light - mobile) */}
      <div
        className="absolute inset-0 opacity-[0.07] dark:hidden sm:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.26) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Grid background (light - desktop) */}
      <div
        className="absolute inset-0 opacity-[0.10] dark:hidden hidden sm:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.3) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Grid background (dark - mobile) */}
      <div
        className="absolute inset-0 opacity-[0.07] hidden dark:block sm:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.26) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Grid background (dark - desktop) */}
      <div
        className="absolute inset-0 opacity-[0.10] hidden dark:sm:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
    </div>
  );
});

BackgroundFX.displayName = "BackgroundFX";

export default BackgroundFX;
