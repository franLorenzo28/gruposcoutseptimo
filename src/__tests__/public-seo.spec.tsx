import sitemap from "../../public/sitemap.xml?raw";
import { cleanup, render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Seo from "@/components/Seo";
import { PublicLanguageProvider } from "@/i18n/PublicLanguageContext";

afterEach(cleanup);

function renderSeo(path: string) {
  render(<HelmetProvider><MemoryRouter initialEntries={[path]}><PublicLanguageProvider><Seo /></PublicLanguageProvider></MemoryRouter></HelmetProvider>);
}

describe("public search visibility", () => {
  it.each(["/eventos", "/archivo", "/archivo/scoutpedia", "/archivo/locales"])("keeps %s indexable with its own canonical URL", async (path) => {
    renderSeo(path);
    await waitFor(() => expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", `https://gruposcoutseptimo.vercel.app${path}`));
    expect(document.head.querySelector('meta[name="robots"][content^="noindex"]')).toBeNull();
  });

  it.each(["/galeria", "/archivo/compania", "/eventos/jamborees", "/interno/dashboard"])("keeps %s out of the public index", async (path) => {
    renderSeo(path);
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow"));
  });

  it("lists only public routes in the generated sitemap", () => {
    for (const path of ["/eventos", "/archivo", "/archivo/scoutpedia", "/archivo/locales", "/contacto"]) {
      expect(sitemap).toContain(`<loc>https://gruposcoutseptimo.vercel.app${path}</loc>`);
    }
    for (const path of ["/usuarios", "/galeria", "/interno", "/archivo/compania"]) {
      expect(sitemap).not.toContain(`<loc>https://gruposcoutseptimo.vercel.app${path}</loc>`);
    }
  });
});
