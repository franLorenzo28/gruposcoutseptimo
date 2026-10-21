import { afterEach, describe, expect, it, vi } from "vitest";
import { getDocumentoDownloadUrl } from "@/lib/documentos";
import { getPppDownloadUrl, type PppFile } from "@/lib/ppp-files";
import { startFileDownload } from "@/lib/file-download";

const mocks = vi.hoisted(() => ({
  signedUrl: vi.fn(),
  documentSingle: vi.fn(),
}));

vi.mock("@/lib/backend", () => ({ isLocalBackend: () => false }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ single: mocks.documentSingle }) }) }),
    }),
    storage: { from: () => ({ createSignedUrl: mocks.signedUrl }) },
  },
}));

afterEach(() => vi.restoreAllMocks());

describe("internal file downloads", () => {
  it("requests an attachment with the original document name", async () => {
    mocks.documentSingle.mockResolvedValueOnce({ data: { storage_path: "rama_rover/file", original_filename: "Ficha.pdf" }, error: null });
    mocks.signedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://storage.example/file" }, error: null });

    expect(await getDocumentoDownloadUrl("rover", "doc-1")).toBe("https://storage.example/file");
    expect(mocks.signedUrl).toHaveBeenCalledWith("rama_rover/file", 3600, { download: "Ficha.pdf" });
  });

  it("requests an attachment for a personal progression file", async () => {
    mocks.signedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://storage.example/ppp" }, error: null });
    const file = { storage_path: "owner/rover/file", original_filename: "Mi avance.pdf" } as PppFile;

    expect(await getPppDownloadUrl(file)).toBe("https://storage.example/ppp");
    expect(mocks.signedUrl).toHaveBeenCalledWith("owner/rover/file", 60, { download: "Mi avance.pdf" });
  });

  it("starts the signed download without opening a popup", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const open = vi.spyOn(window, "open");

    startFileDownload("https://storage.example/file");

    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.instances[0] as HTMLAnchorElement).href).toBe("https://storage.example/file");
    expect(open).not.toHaveBeenCalled();
  });
});
