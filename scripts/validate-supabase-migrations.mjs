import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(repositoryRoot, "supabase", "migrations");
const migrationName = /^(\d{8}|\d{14})_[a-z0-9][a-z0-9_]*\.sql$/;

const acceptedLegacyDateVersions = new Set([
  "20251103",
  "20260101",
  "20260329",
  "20260408",
  "20260409",
  "20260410",
  "20260411",
  "20260412",
  "20260413",
  "20260414",
  "20260415",
  "20260416",
  "20260417",
  "20260418",
  "20260419",
  "20260421",
  "20260422",
  "20260427",
  "20260428",
  "20260429",
  "20260431",
  "20260501",
  "20260502",
  "20260503",
  "20260527",
  "20260601",
  "20260602",
  "20260603",
  "20260614",
  "20260615",
  "20260616",
  "20260620",
  "20260621",
  "20260622",
  "20260623",
  "20260624",
  "20260625",
  "20260626",
  "20260701",
  "20260715",
  "20260717",
  "20260801",
  "20260802",
  "20260803",
  "20260810",
  "20260812",
  "20260813",
  "20260814",
  "20260817",
]);

// Versiones ya presentes antes de establecer la convención de 14 dígitos.
// No se renombran automáticamente porque algunas ya existen en el historial remoto.
const acceptedLegacyDuplicates = new Map([
  ["20260101", 4],
  ["20260427", 2],
  ["20260621", 2],
  ["20260817", 3],
]);

const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql"));
const invalidNames = [];
const versions = new Map();

for (const file of files) {
  const match = file.match(migrationName);
  if (!match) {
    invalidNames.push(file);
    continue;
  }

  const version = match[1];
  if (version.length === 8 && !acceptedLegacyDateVersions.has(version)) {
    invalidNames.push(`${file} (las migraciones nuevas requieren 14 dígitos)`);
    continue;
  }
  const entries = versions.get(version) ?? [];
  entries.push(file);
  versions.set(version, entries);
}

const unexpectedDuplicates = [];
for (const [version, entries] of versions) {
  if (entries.length < 2) continue;
  if (acceptedLegacyDuplicates.get(version) !== entries.length) {
    unexpectedDuplicates.push(`${version}: ${entries.join(", ")}`);
  }
}

if (invalidNames.length > 0 || unexpectedDuplicates.length > 0) {
  if (invalidNames.length > 0) {
    console.error(`Migraciones con nombre inválido: ${invalidNames.join(", ")}`);
  }
  if (unexpectedDuplicates.length > 0) {
    console.error(`Versiones de migración duplicadas: ${unexpectedDuplicates.join(" | ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Migraciones validadas: ${files.length} archivos versionados.`);
}
