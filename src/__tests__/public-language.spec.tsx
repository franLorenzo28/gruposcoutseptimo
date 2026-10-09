import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import PublicLanguageSwitcher from "@/components/layout/PublicLanguageSwitcher";
import { PublicLanguageProvider } from "@/i18n/PublicLanguageContext";
import PublicDomTranslator from "@/i18n/PublicDomTranslator";

function ExamplePage() {
  const [showMore, setShowMore] = useState(false);
  return <>
    <PublicDomTranslator />
    <PublicLanguageSwitcher />
    <p>Quiero sumarme</p>
    <p translate="no">Volteadores 1753, Montevideo</p>
    <input aria-label="Tu nombre" placeholder="Tu nombre" />
    <button type="button" data-no-translate onClick={() => setShowMore(true)}>Show more fixture</button>
    {showMore && <p>Envíanos un mensaje</p>}
  </>;
}

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); document.documentElement.lang = "es"; });

describe("public language mode", () => {
  it("switches text and attributes, remembers the choice, and translates later content", async () => {
    const user = userEvent.setup();
    render(<PublicLanguageProvider><ExamplePage /></PublicLanguageProvider>);

    await user.click(screen.getByRole("button", { name: /Idioma del sitio/ }));
    await user.click(screen.getByRole("menuitem", { name: "Português" }));
    expect(await screen.findByText("Quero participar")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Seu nome" })).toHaveAttribute("placeholder", "Seu nome");
    expect(document.documentElement.lang).toBe("pt-BR");
    expect(window.localStorage.getItem("grupo7_public_language")).toBe("pt");
    expect(screen.getByText("Volteadores 1753, Montevideo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more fixture" }));
    expect(await screen.findByText("Envie uma mensagem")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Idioma do site/ }));
    await user.click(screen.getByRole("menuitem", { name: "English" }));
    expect(await screen.findByText("I want to join")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveAttribute("placeholder", "Your name");
    expect(window.localStorage.getItem("grupo7_public_language")).toBe("en");

    await user.click(screen.getByRole("button", { name: /Site language/ }));
    await user.click(screen.getByRole("menuitem", { name: "Español" }));
    await waitFor(() => expect(screen.getByText("Quiero sumarme")).toBeInTheDocument());
    expect(document.documentElement.lang).toBe("es-UY");
  }, 15000);
});
