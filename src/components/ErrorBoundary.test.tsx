import { Component, lazy, Suspense } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";
import { recoverChunkLoad, reloadPage } from "@/lib/chunk-recovery";

vi.mock("@/lib/chunk-recovery", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/chunk-recovery")>(),
  recoverChunkLoad: vi.fn(() => false),
  reloadPage: vi.fn(),
}));

afterEach(() => vi.restoreAllMocks());

describe("ErrorBoundary recovery", () => {
  it("offers a full reload for a rejected lazy import", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new TypeError("Failed to fetch dynamically imported module: /assets/old.js");
    const Page = lazy(() => Promise.reject(failure));
    render(<ErrorBoundary><Suspense fallback="Loading"><Page /></Suspense></ErrorBoundary>);
    fireEvent.click(await screen.findByRole("button", { name: "Recargar página" }));
    expect(recoverChunkLoad).toHaveBeenCalledWith(failure);
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it("resets the component tree for an ordinary render error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let broken = true;
    class Page extends Component {
      render() {
        if (broken) throw new Error("Render failed");
        return <p>Recovered</p>;
      }
    }
    render(<ErrorBoundary><Page /></ErrorBoundary>);
    broken = false;
    fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(await screen.findByText("Recovered")).toBeInTheDocument();
  });
});
