import { memo } from "react";

const BackgroundFX = memo(() => {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute -top-40 -right-36 h-[32rem] w-[32rem] rounded-full opacity-30 dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle, hsl(0 100% 50% / 0.25) 0%, hsl(0 100% 50% / 0.08) 42%, transparent 72%)",
          filter: "blur(42px)",
        }}
      />

      <div
        className="absolute -bottom-44 -left-36 h-[30rem] w-[30rem] rounded-full opacity-25 dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle, hsl(45 85% 55% / 0.22) 0%, hsl(45 85% 55% / 0.08) 40%, transparent 70%)",
          filter: "blur(46px)",
        }}
      />
    </div>
  );
});

BackgroundFX.displayName = "BackgroundFX";

export default BackgroundFX;
