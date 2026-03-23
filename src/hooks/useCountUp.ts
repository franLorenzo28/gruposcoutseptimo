import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  start?: number;
  rootMargin?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(
  target: number,
  duration: number,
  options: UseCountUpOptions = {},
) {
  const { start = 0, rootMargin = "0px 0px -10% 0px" } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [currentValue, setCurrentValue] = useState(start);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin, threshold: 0.25 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (!started) return;

    let rafId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const next = Math.round(start + (target - start) * eased);
      setCurrentValue(next);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [duration, start, started, target]);

  return { value: currentValue, ref };
}

export default useCountUp;
