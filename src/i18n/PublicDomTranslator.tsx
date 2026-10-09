import { useLayoutEffect, useRef } from "react";
import { usePublicLanguage } from "./PublicLanguageContext";
import { normalizePublicCopy, translatePublicCopy } from "./public-copy";

const translatableAttributes = ["alt", "aria-label", "aria-description", "placeholder", "title"] as const;
const ignoredElements = "[data-no-translate], [translate='no'], script, style, textarea, pre, code, option:not([value]), [contenteditable='true']";

function preserveSpacing(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

export default function PublicDomTranslator() {
  const { language } = usePublicLanguage();
  const textOriginals = useRef(new WeakMap<Text, { original: string; applied: string }>());
  const attributeOriginals = useRef(new WeakMap<Element, Map<string, { original: string; applied: string }>>());

  useLayoutEffect(() => {
    document.documentElement.lang = language === "pt" ? "pt-BR" : language === "en" ? "en" : "es-UY";

    const translateText = (node: Text) => {
      if (!node.parentElement || node.parentElement.closest(ignoredElements)) return;
      const current = node.data;
      if (!normalizePublicCopy(current)) return;
      const previous = textOriginals.current.get(node);
      const original = previous && current === previous.applied ? previous.original : current;
      const translated = language === "es" ? original : preserveSpacing(original, translatePublicCopy(original, language));
      textOriginals.current.set(node, { original, applied: translated });
      if (current !== translated) node.data = translated;
    };

    const translateAttributes = (element: Element) => {
      if (element.closest(ignoredElements)) return;
      let originals = attributeOriginals.current.get(element);
      if (!originals) {
        originals = new Map();
        attributeOriginals.current.set(element, originals);
      }
      for (const attribute of translatableAttributes) {
        const current = element.getAttribute(attribute);
        if (!current) continue;
        const previous = originals.get(attribute);
        const original = previous && current === previous.applied ? previous.original : current;
        const translated = translatePublicCopy(original, language);
        originals.set(attribute, { original, applied: translated });
        if (current !== translated) element.setAttribute(attribute, translated);
      }
    };

    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text); return; }
      if (!(root instanceof Element) && root !== document.body) return;
      if (root instanceof Element) translateAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.nodeType === Node.TEXT_NODE) translateText(walker.currentNode as Text);
        else translateAttributes(walker.currentNode as Element);
      }
    };

    translateTree(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" || mutation.type === "attributes") translateTree(mutation.target);
        else mutation.addedNodes.forEach(translateTree);
      }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: [...translatableAttributes],
    });

    return () => {
      observer.disconnect();
      document.documentElement.lang = "es-UY";
    };
  }, [language]);

  return null;
}
