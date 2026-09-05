import { useEffect, useState } from "react";

/**
 * Tracks only threshold crossings, not every scroll position. The passive
 * listener and requestAnimationFrame keep navigation updates off the hot path.
 */
export function useScrolledHeader(threshold = 12): boolean {
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > threshold : false,
  );

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = window.scrollY > threshold;
      setIsScrolled((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return isScrolled;
}
