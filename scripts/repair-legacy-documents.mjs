// One-time, idempotent repair of two reviewed historical documents.
// Dry run: LEGACY_ROVER_PDF_PATH=<absolute path> node --env-file=server/.env scripts/repair-legacy-documents.mjs
// Stage:   LEGACY_DOC_REPAIR_APPROVED=1 LEGACY_ROVER_PDF_PATH=<absolute path> node --env-file=server/.env scripts/repair-legacy-documents.mjs --stage
// Finalize after migration: replace --stage with --finalize.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const projectRef = "lndqeaspuwwgdwbggayd";
const bucket = "rama-documentos";
const image = {
  id: "d9609d27-9dcd-4cc5-b2ef-3725cf4c5806",
  name: "patrulla_adler_1966_elias_regules.png",
  source: "rama_caminantes/1775960412591-patrulla_adler_1966_elias_regules.png",
  target: "rama_tropa/1775960412591-patrulla_adler_1966_elias_regules.png",
  mime: "image/png",
  size: 380837,
  sha256: "2bf0afb3ec6358cc182263e1803a9bc959a08b2f48a54da12cf749e00cce2916",
};
const pdf = {
  id: "130ab95c-3e69-4339-b41a-1e66c4b4e0cd",
  name: "campamento_distrito_1965.pdf",
  path: "rama_rover/1775962693285-campamento_distrito_1965.pdf",
  mime: "application/pdf",
  size: 108594,
  sha256: "364abc09156e4b12e676d103f1c72bcc8939e8aaf3b4c92d353dea7b3f342d85",
};

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pdfPath = process.env.LEGACY_ROVER_PDF_PATH;
const stage = process.argv.includes("--stage");
const finalize = process.argv.includes("--finalize");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function take(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

if (!url || !key || !pdfPath) throw new Error("Faltan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o LEGACY_ROVER_PDF_PATH.");
assert(new URL(url).hostname === `${projectRef}.supabase.co`, "El proyecto Supabase no coincide con el esperado.");
assert(!(stage && finalize), "Elige una sola fase: --stage o --finalize.");
if (stage || finalize) assert(process.env.LEGACY_DOC_REPAIR_APPROVED === "1", "Para modificar Storage, define LEGACY_DOC_REPAIR_APPROVED=1.");

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const storage = admin.storage.from(bucket);

async function readObject(path) {
  const result = await storage.info(path);
  if (result.error) {
    const status = Number(result.error.statusCode);
    if (status === 404 || /not found/i.test(result.error.message)) return null;
    throw new Error(`Consultar ${path}: ${result.error.message}`);
  }
  const blob = take(await storage.download(path), `Descargar ${path}`);
  return Buffer.from(await blob.arrayBuffer());
}

async function checkObject(path, expectedHash, label) {
  const bytes = await readObject(path);
  assert(bytes && sha256(bytes) === expectedHash, `${label}: el archivo no coincide con el SHA-256 esperado.`);
  return bytes;
}

async function ensureObject(path, bytes, mime, label) {
  const existing = await readObject(path);
  if (existing) {
    assert(sha256(existing) === sha256(bytes), `${label}: ya existe otro archivo en la ruta de destino.`);
    return false;
  }
  take(await storage.upload(path, bytes, { contentType: mime, upsert: false }), `Subir ${label}`);
  await checkObject(path, sha256(bytes), label);
  return true;
}

async function main() {
  const localPdf = await readFile(pdfPath);
  assert(localPdf.length === pdf.size && localPdf.subarray(0, 5).toString() === "%PDF-", "El PDF local no tiene el tipo o tamaño esperado.");
  assert(sha256(localPdf) === pdf.sha256, "El PDF local no coincide con el SHA-256 esperado.");

  const imageRow = take(await admin.from("rama_documentos")
    .select("id,rama,nombre,original_filename,mime_type,tamaño,storage_path,categoria")
    .eq("id", image.id).single(), "Consultar imagen histórica");
  const pdfRow = take(await admin.from("rama_documentos")
    .select("id,rama,nombre,original_filename,mime_type,tamaño,storage_path,categoria")
    .eq("id", pdf.id).single(), "Consultar registro Rover");

  assert(imageRow.nombre === image.name && imageRow.original_filename === image.name
    && imageRow.mime_type === image.mime && imageRow.tamaño === image.size && imageRow.categoria === "general",
  "Los metadatos de la imagen histórica cambiaron.");
  assert(pdfRow.rama === "rover" && pdfRow.storage_path === pdf.path
    && pdfRow.nombre === pdf.name && pdfRow.original_filename === pdf.name
    && pdfRow.mime_type === pdf.mime && pdfRow.tamaño === pdf.size && pdfRow.categoria === "general",
  "Los metadatos del documento Rover cambiaron.");
  const imagePending = imageRow.rama === "caminantes" && imageRow.storage_path === image.source;
  const imageDone = imageRow.rama === "tropa" && imageRow.storage_path === image.target;
  assert(imagePending || imageDone, "La unidad o ruta de la imagen histórica cambió de forma inesperada.");

  const sourceBytes = imagePending ? await checkObject(image.source, image.sha256, "Imagen de origen") : null;
  const targetBytes = await readObject(image.target);
  if (targetBytes) assert(sha256(targetBytes) === image.sha256, "La ruta de Tropa contiene otro archivo.");
  if (imageDone) assert(targetBytes, "La imagen figura en Tropa, pero falta su archivo.");
  const remotePdf = await readObject(pdf.path);
  if (remotePdf) assert(sha256(remotePdf) === pdf.sha256, "La ruta Rover contiene otro PDF.");

  console.log(JSON.stringify({
    mode: stage ? "stage" : finalize ? "finalize" : "dry-run",
    image: imagePending ? "mover de Caminantes a Tropa" : "ya está en Tropa",
    roverPdf: remotePdf ? "ya restaurado" : "restaurar desde el archivo local",
    imageSourceSha256: sourceBytes ? sha256(sourceBytes) : null,
    localPdfSha256: sha256(localPdf),
  }));
  if (stage) {
    assert(imagePending, "La imagen ya no figura en Caminantes; no hace falta preparar la copia.");
    await ensureObject(pdf.path, localPdf, pdf.mime, "PDF Rover");
    await ensureObject(image.target, sourceBytes, image.mime, "imagen Tropa");
    console.log("Archivos preparados y verificados. Aplica la migración versionada antes de finalizar.");
  }
  if (finalize) {
    assert(imageDone, "La migración todavía no movió el registro a Tropa.");
    await checkObject(image.target, image.sha256, "Imagen final Tropa");
    await checkObject(pdf.path, pdf.sha256, "PDF final Rover");
    if (await readObject(image.source)) take(await storage.remove([image.source]), "Retirar copia antigua de Caminantes");
    assert(!(await readObject(image.source)), "La copia antigua de Caminantes sigue en Storage.");
    console.log("Reparación verificada: imagen en Tropa y PDF Rover descargables; registros conservados.");
  }
}

await main();
