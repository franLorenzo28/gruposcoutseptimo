import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installChunkRecovery, isChunkLoadError, recoverChunkLoad } from "./chunk-recovery";

const chunkError = new TypeError("Failed to fetch dynamically imported module: /assets/old.js");

describe("chunk recovery", () => {
  let reload: ReturnType<typeof vi.fn>;
  let browser: EventTarget & {
    location: { reload: ReturnType<typeof vi.fn> };
    sessionStorage: Storage;
    navigator: { onLine: boolean };
  };

  beforeEach(() => {
    sessionStorage.clear();
    reload = vi.fn();
    browser = Object.assign(new EventTarget(), {
      location: { reload }, sessionStorage, navigator: { onLine: true },
    });
    vi.stubGlobal("window", browser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    chunkError,
    new TypeError("error loading dynamically imported module: /assets/old.js"),
    new TypeError("Importing a module script failed."),
    new Error("Loading chunk 123 failed."),
    new Error("Unable to preload CSS for /assets/old.css"),
  ])("recognizes browser chunk errors: %s", (error) => {
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("reloads only once even after reinstalling the listener or reimporting the module", async () => {
    const fire = () => browser.dispatchEvent(Object.assign(new Event("vite:preloadError"), { payload: chunkError }));
    const cleanup = installChunkRecovery();
    fire();
    expect(reload).toHaveBeenCalledTimes(1);
    // ErrorBoundary can receive the same failure after Vite's event.
    expect(recoverChunkLoad(chunkError)).toBe(false);
    cleanup();
    vi.resetModules();
    const freshModule = await import("./chunk-recovery");
    const cleanupFresh = freshModule.installChunkRecovery();
    fire();
    expect(reload).toHaveBeenCalledTimes(1);
    cleanupFresh();
  });

  it("allows recovery when storage contains a different build", () => {
    browser.sessionStorage.setItem("grupo7_chunk_reload_build", "https://example.com/assets/previous-build.js");
    expect(recoverChunkLoad(chunkError)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not consume recovery while offline", () => {
    browser.navigator.onLine = false;
    expect(recoverChunkLoad(chunkError)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    browser.navigator.onLine = true;
    expect(recoverChunkLoad(chunkError)).toBe(true);
  });

  it.each(["getItem", "setItem"] as const)("does not reload when storage %s throws", (method) => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error("Storage blocked"); });
    expect(() => recoverChunkLoad(chunkError)).not.toThrow();
    expect(recoverChunkLoad(chunkError)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([new TypeError("Failed to fetch"), new Error("Invalid component"), undefined])("leaves unrelated errors to the boundary: %s", (error) => {
    expect(recoverChunkLoad(error)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not swallow persistent preload errors", () => {
    recoverChunkLoad(chunkError);
    const cleanup = installChunkRecovery();
    const event = Object.assign(new Event("vite:preloadError", { cancelable: true }), { payload: chunkError });
    browser.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
