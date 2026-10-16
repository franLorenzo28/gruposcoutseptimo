import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = hash.slice(1);
    let focusTimeout: number | undefined;
    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });
      target.focus({ preventScroll: true });
      // Lazy route content can replace the target during its first render.
      focusTimeout = window.setTimeout(() => {
        if (document.activeElement === document.body) {
          document.getElementById(id)?.focus({ preventScroll: true });
        }
      }, 100);
      return true;
    };

    if (scrollToTarget()) return () => window.clearTimeout(focusTimeout);
    const observer = new MutationObserver(() => {
      if (scrollToTarget()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 3000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      window.clearTimeout(focusTimeout);
    };
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
