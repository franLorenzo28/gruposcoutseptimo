import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "../..");
const pagePaths = [
  "inicio", "historia", "ramas", "eventos", "archivo", "galeria",
  "Archivo.tsx", "Cancionero.tsx", "Contacto.tsx", "DirigEn.tsx",
  "Locales.tsx", "MiPerfilPublico.tsx", "MovimientoScout.tsx",
  "NotFound.tsx", "PerfilPublic.tsx", "VerificarEmail.tsx", "Veteranos.tsx",
];
const componentPaths = ["sections", "layout", "auth/PublicAuthDialog.tsx", "profile", "Seo.tsx"];
const visibleAttributes = new Set(["alt", "aria-label", "aria-description", "placeholder", "title"]);
const visibleProperties = new Set([
  "name", "label", "title", "subtitle", "description", "detailText", "message",
  "text", "question", "answer", "caption", "placeholder", "feedback",
]);
const ignoredProperties = new Set(["className", "class", "path", "to", "href", "src", "id", "key", "type", "icon"]);
const copy = new Set();

async function filesAt(relativePath) {
  const absolute = path.join(root, relativePath);
  if (/\.tsx?$/.test(relativePath)) return [absolute];
  const entries = await readdir(absolute, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) =>
    entry.isDirectory() || /\.tsx?$/.test(entry.name)).map((entry) =>
    filesAt(path.join(relativePath, entry.name))));
  return nested.flat().filter((file) => /\.tsx?$/.test(file));
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function add(value) {
  const text = normalize(value);
  if (text.length < 2 || text.length > 600 || !/[\p{L}]/u.test(text)) return;
  if (/^(?:https?:|mailto:|tel:|\/|#|@)/i.test(text)) return;
  if (/^[\w.-]+@[\w.-]+\.[a-z]+$/i.test(text)) return;
  if (/(?:^|\s)(?:absolute|relative|fixed|flex|grid|hidden|inline-flex|rounded[-\[]|bg-|text-|transition-|duration-|opacity-|pointer-events|blur-|shadow-|w-|h-|px-|py-|mt-|mb-|gap-|dark:|hover:|focus:)/.test(text)) return;
  if (/^(?:\(prefers-|\[|404 Error:)/.test(text)) return;
  if (/^[\w-]+(?:\s+[\w-]+){3,}$/.test(text) && /(?:hover:|dark:|focus:|\[)/.test(text)) return;
  copy.add(text);
}

for (const file of (await Promise.all([
  ...pagePaths.map((entry) => filesAt(path.join("src/pages", entry))),
  ...componentPaths.map((entry) => filesAt(path.join("src/components", entry))),
])).flat()) {
  const source = await readFile(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (ts.isJsxText(node)) add(node.getText(tree));
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      if (ts.isJsxAttribute(parent)) {
        if (visibleAttributes.has(parent.name.getText(tree))) add(node.text);
      } else if (ts.isPropertyAssignment(parent)) {
        const property = parent.name.getText(tree).replace(/^['"]|['"]$/g, "");
        if (visibleProperties.has(property)) add(node.text);
      } else if (!ts.isImportDeclaration(parent) && !ts.isExportDeclaration(parent)) {
        const property = ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent)
          ? parent.parent.name.getText(tree) : "";
        if (!ignoredProperties.has(property) && /[\sÁÉÍÓÚáéíóúñÑ¿¡]/u.test(node.text)) add(node.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}

const output = path.join(root, "src/i18n/public-source.json");
await writeFile(output, `${JSON.stringify([...copy].sort((a, b) => a.localeCompare(b, "es")), null, 2)}\n`);
console.log(`Extracted ${copy.size} public copy strings to ${path.relative(root, output)}`);
