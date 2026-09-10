import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OptimizedImage } from "@/components/OptimizedImage";

afterEach(cleanup);
it("preserves responsive sources and explicit network priority", () => {
  const { container } = render(<OptimizedImage src="hero.jpg" webpSrc="hero.webp" webpSrcSet="small.webp 640w, large.webp 1200w" sizes="100vw" alt="Hero" priority />);
  expect(screen.getByAltText("Hero")).toHaveAttribute("fetchpriority", "high");
  expect(screen.getByAltText("Hero")).toHaveAttribute("loading", "eager");
  expect(container.querySelector("source")).toHaveAttribute("srcset", "small.webp 640w, large.webp 1200w");
  expect(container.querySelector("source")).toHaveAttribute("sizes", "100vw");
});
it("keeps internal loading and fallback when callers supply callbacks, then resets for another source", () => {
  const onLoad = vi.fn(); const onError = vi.fn();
  const { rerender, container } = render(<OptimizedImage src="a.jpg" webpSrc="a.webp" fallbackSrc="fallback.jpg" alt="Foto" onLoad={onLoad} onError={onError} />);
  fireEvent.error(screen.getByAltText("Foto"));
  expect(onError).toHaveBeenCalledOnce();
  expect(screen.getByAltText("Foto")).toHaveAttribute("src", "fallback.jpg");
  expect(container.querySelector("source")).toBeNull();
  rerender(<OptimizedImage src="b.jpg" webpSrc="b.webp" alt="Foto" onLoad={onLoad} />);
  expect(screen.getByAltText("Foto")).toHaveClass("opacity-0");
  fireEvent.load(screen.getByAltText("Foto"));
  expect(screen.getByAltText("Foto")).toHaveClass("opacity-100");
  expect(onLoad).toHaveBeenCalledOnce();
});
