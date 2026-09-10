import { beforeEach, expect, it, vi } from "vitest";
import { listImagePaths, listImages } from "@/lib/gallery";

const mocks = vi.hoisted(() => ({ list: vi.fn(), signed: vi.fn(), session: vi.fn(), local: vi.fn(), api: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getUser: mocks.session },
  storage: { from: () => ({ list: mocks.list, createSignedUrls: mocks.signed }) },
} }));
vi.mock("@/lib/backend", () => ({ isLocalBackend: mocks.local, apiFetch: mocks.api }));
vi.mock("@/lib/admin-permissions", () => ({ ensureAdminForMediaUpload: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks(); mocks.local.mockReturnValue(false);
  mocks.session.mockResolvedValue({ data: { user: { id: "scout" } } });
});
it("polls paths without creating signed URLs, filtering hidden and non-image objects", async () => {
  mocks.list.mockResolvedValue({ data: [{ name: "photo.JPG" }, { name: ".keep" }, { name: ".private.jpg" }, { name: "notes.txt" }], error: null });
  expect(await listImagePaths("camp")).toEqual(["camp/photo.JPG"]);
  expect(mocks.signed).not.toHaveBeenCalled();
});
it("paginates storage metadata and signs in bounded batches", async () => {
  mocks.list.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, id) => ({ name: `${id}.jpg` })), error: null })
    .mockResolvedValueOnce({ data: [{ name: "last.webp" }], error: null });
  mocks.signed.mockImplementation((paths: string[]) => Promise.resolve({ data: paths.map(path => ({ path, signedUrl: `https://example.test/${path}`, error: null })), error: null }));
  expect(await listImages("camp")).toHaveLength(1001);
  expect(mocks.list.mock.calls[1]?.[1]).toMatchObject({ offset: 1000 });
  expect(mocks.signed).toHaveBeenCalledTimes(11);
});
it("rejects metadata failures and unauthorized users instead of caching an empty album", async () => {
  mocks.list.mockResolvedValue({ data: null, error: new Error("denied") });
  await expect(listImagePaths("camp")).rejects.toThrow("denied");
  mocks.session.mockResolvedValue({ data: { user: null } });
  await expect(listImagePaths("camp")).rejects.toThrow("iniciar sesion");
});
it("preserves the local backend endpoint", async () => {
  mocks.local.mockReturnValue(true); mocks.api.mockResolvedValue([{ path: "a/p.jpg", url: "local.jpg" }]);
  expect(await listImagePaths("a")).toEqual(["a/p.jpg"]);
  expect(mocks.api).toHaveBeenCalledWith("/gallery/albums/a/images");
  expect(mocks.list).not.toHaveBeenCalled();
});
