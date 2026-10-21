// End-to-end Storage probe. Creates disposable Auth users and tiny PDF objects,
// then removes every object, metadata row, and user it created.
// Required env: STORAGE_PROBE_URL, STORAGE_PROBE_ANON_KEY,
// STORAGE_PROBE_SERVICE_ROLE_KEY, STORAGE_PROBE_PROJECT_REF, STORAGE_PROBE_APPROVED=1.
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.STORAGE_PROBE_URL;
const anonKey = process.env.STORAGE_PROBE_ANON_KEY;
const serviceKey = process.env.STORAGE_PROBE_SERVICE_ROLE_KEY;
const projectRef = process.env.STORAGE_PROBE_PROJECT_REF;

if (!url || !anonKey || !serviceKey || !projectRef || process.env.STORAGE_PROBE_APPROVED !== "1") {
  throw new Error("Faltan credenciales o STORAGE_PROBE_APPROVED=1.");
}
if (new URL(url).hostname !== `${projectRef}.supabase.co`) {
  throw new Error("STORAGE_PROBE_PROJECT_REF no corresponde a STORAGE_PROBE_URL.");
}

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, serviceKey, options);
const token = randomUUID().replaceAll("-", "");
const password = randomBytes(24).toString("base64url");
const users = [];
const objects = [];
const rows = [];
const pdf = new Blob(["%PDF-1.4\n% Storage probe\n%%EOF\n"], { type: "application/pdf" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function take(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function makeUser(label, profile) {
  const email = `codex-storage-${token}-${label}@example.invalid`;
  const created = take(await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: "Storage Probe", account_kind: "publico" },
  }), `Crear cuenta ${label}`);
  const id = created.user.id;
  users.push(id);
  take(await admin.from("profiles").upsert({
    user_id: id, email, nombre_completo: `Storage Probe ${label}`,
    account_status: "activo", internal_access: false, ...profile,
  }, { onConflict: "user_id" }), `Configurar perfil ${label}`);

  const client = createClient(url, anonKey, options);
  take(await client.auth.signInWithPassword({ email, password }), `Iniciar sesión ${label}`);
  return { id, client };
}

async function expectDenied(operation, label) {
  const result = await operation();
  assert(result.error, `${label}: se permitió una acción prohibida`);
}

async function expectNotVisible(client, table, filter, label) {
  const result = take(await client.from(table).select("id").eq("storage_path", filter), label);
  assert(result.length === 0, `${label}: apareció una fila de otra unidad`);
}

async function assertStillStored(bucket, path, label) {
  const result = await admin.storage.from(bucket).info(path);
  assert(!result.error, `${label}: el archivo desapareció`);
}

async function assertRemoved(bucket, path, label) {
  const result = await admin.storage.from(bucket).info(path);
  assert(result.error, `${label}: el archivo sigue en Storage`);
}

const cleanupErrors = [];
try {
  const rover = await makeUser("rover", { internal_access: true, internal_unit: "rover", edad: 19 });
  const roverEducator = await makeUser("rover-educator", {
    internal_access: true, rol_adulto: "Educador/a", educador_aprobado: true, rama_que_educa: "rovers",
  });
  const manadaEducator = await makeUser("manada-educator", {
    internal_access: true, rol_adulto: "Educador/a", educador_aprobado: true, rama_que_educa: "manada",
  });
  const publicUser = await makeUser("public", {});

  const pppPath = `${rover.id}/rover/codex-storage-${token}`;
  const sharedPath = `rama_rover/codex-storage-${token}`;
  const deniedPaths = [
    { bucket: "ppp-files", path: `${publicUser.id}/rover/codex-storage-denied-${token}` },
    { bucket: "ppp-files", path: `${roverEducator.id}/rover/codex-storage-denied-${token}` },
    { bucket: "rama-documentos", path: `rama_rover/codex-storage-denied-member-${token}` },
    { bucket: "rama-documentos", path: `rama_rover/codex-storage-denied-manada-${token}` },
  ];
  objects.push({ bucket: "ppp-files", path: pppPath }, { bucket: "rama-documentos", path: sharedPath }, ...deniedPaths);

  await expectDenied(() => publicUser.client.storage.from("ppp-files").upload(deniedPaths[0].path, pdf), "Subir PPP como cuenta pública");
  await expectDenied(() => roverEducator.client.storage.from("ppp-files").upload(deniedPaths[1].path, pdf), "Subir PPP como educador");
  await expectDenied(() => rover.client.storage.from("rama-documentos").upload(deniedPaths[2].path, pdf), "Subir formulario como integrante");
  await expectDenied(() => manadaEducator.client.storage.from("rama-documentos").upload(deniedPaths[3].path, pdf), "Subir formulario Rover desde Manada");

  take(await rover.client.storage.from("ppp-files").upload(pppPath, pdf, {
    contentType: "application/pdf", upsert: false,
  }), "Subir PPP del titular");
  take(await rover.client.from("ppp_files").insert({
    owner_id: rover.id, rama: "rover", storage_path: pppPath,
    original_filename: "progresion-prueba.pdf", mime_type: "application/pdf", size_bytes: pdf.size,
  }), "Registrar PPP");
  rows.push({ table: "ppp_files", path: pppPath });

  for (const [label, client] of [["titular", rover.client], ["educador Rover", roverEducator.client]]) {
    const signed = take(await client.storage.from("ppp-files").createSignedUrl(pppPath, 60, {
      download: "progresion-prueba.pdf",
    }), `Firmar PPP: ${label}`);
    const response = await fetch(signed.signedUrl);
    assert(response.ok && (await response.text()).includes("Storage probe"), `Descargar PPP: ${label}`);
    assert(response.headers.get("content-disposition")?.includes("progresion-prueba.pdf"), `Nombre de descarga PPP: ${label}`);
  }
  for (const [label, client] of [["educador Manada", manadaEducator.client], ["cuenta pública", publicUser.client]]) {
    await expectNotVisible(client, "ppp_files", pppPath, `Metadatos PPP: ${label}`);
    await expectDenied(() => client.storage.from("ppp-files").createSignedUrl(pppPath, 60), `Firmar PPP: ${label}`);
  }
  await roverEducator.client.storage.from("ppp-files").remove([pppPath]);
  await assertStillStored("ppp-files", pppPath, "Borrar PPP como educador");

  take(await roverEducator.client.storage.from("rama-documentos").upload(sharedPath, pdf, {
    contentType: "application/pdf", upsert: false,
  }), "Subir formulario Rover");
  take(await roverEducator.client.from("rama_documentos").insert({
    rama: "rover", nombre: "Formulario de prueba", original_filename: "formulario-prueba.pdf",
    mime_type: "application/pdf", tamaño: pdf.size, storage_path: sharedPath,
    subido_por: roverEducator.id, categoria: "formulario",
  }), "Registrar formulario Rover");
  rows.push({ table: "rama_documentos", path: sharedPath });

  for (const [label, client] of [["integrante Rover", rover.client], ["educador Rover", roverEducator.client]]) {
    const signed = take(await client.storage.from("rama-documentos").createSignedUrl(sharedPath, 60, {
      download: "formulario-prueba.pdf",
    }), `Firmar formulario: ${label}`);
    const response = await fetch(signed.signedUrl);
    assert(response.ok && (await response.text()).includes("Storage probe"), `Descargar formulario: ${label}`);
    assert(response.headers.get("content-disposition")?.includes("formulario-prueba.pdf"), `Nombre de descarga formulario: ${label}`);
  }
  for (const [label, client] of [["educador Manada", manadaEducator.client], ["cuenta pública", publicUser.client]]) {
    await expectNotVisible(client, "rama_documentos", sharedPath, `Metadatos formulario: ${label}`);
    await expectDenied(() => client.storage.from("rama-documentos").createSignedUrl(sharedPath, 60), `Firmar formulario: ${label}`);
  }
  await rover.client.storage.from("rama-documentos").remove([sharedPath]);
  await assertStillStored("rama-documentos", sharedPath, "Borrar formulario como integrante");

  take(await rover.client.storage.from("ppp-files").remove([pppPath]), "Borrar PPP como titular");
  await assertRemoved("ppp-files", pppPath, "Borrar PPP como titular");
  take(await rover.client.from("ppp_files").delete().eq("storage_path", pppPath), "Borrar metadatos PPP");
  take(await roverEducator.client.storage.from("rama-documentos").remove([sharedPath]), "Borrar formulario como educador");
  await assertRemoved("rama-documentos", sharedPath, "Borrar formulario como educador");
  take(await roverEducator.client.from("rama_documentos").delete().eq("storage_path", sharedPath), "Borrar metadatos formulario");

  console.log("Storage API: subida, lectura, descarga, denegaciones y borrado correctos.");
} finally {
  for (const { bucket, path } of objects) {
    const result = await admin.storage.from(bucket).remove([path]);
    if (result.error) cleanupErrors.push(`${bucket}/${path}: ${result.error.message}`);
  }
  for (const { table, path } of rows) {
    const result = await admin.from(table).delete().eq("storage_path", path);
    if (result.error) cleanupErrors.push(`${table}/${path}: ${result.error.message}`);
  }
  for (const id of users) {
    const result = await admin.auth.admin.deleteUser(id);
    if (result.error) cleanupErrors.push(`Usuario ${id}: ${result.error.message}`);
    const mirror = await admin.from("app_users").select("id").eq("id", id);
    if (mirror.error || mirror.data?.length) {
      cleanupErrors.push(`Identidad local ${id}: no se eliminó con Auth`);
      const removed = await admin.from("app_users").delete().eq("id", id);
      if (removed.error) cleanupErrors.push(`Identidad local ${id}: ${removed.error.message}`);
    }
    const profile = await admin.from("profiles").select("id").eq("user_id", id);
    if (profile.error || profile.data?.length) {
      cleanupErrors.push(`Perfil ${id}: no se eliminó con Auth`);
      const removed = await admin.from("profiles").delete().eq("user_id", id);
      if (removed.error) cleanupErrors.push(`Perfil ${id}: ${removed.error.message}`);
    }
  }
  for (const id of users) {
    const authUser = await admin.auth.admin.getUserById(id);
    if (!authUser.error) cleanupErrors.push(`Usuario ${id}: aún existe`);
    const profile = await admin.from("profiles").select("id").eq("user_id", id);
    if (profile.error || profile.data?.length) cleanupErrors.push(`Perfil ${id}: aún existe o no se pudo verificar`);
    const appUser = await admin.from("app_users").select("id").eq("id", id);
    if (appUser.error || appUser.data?.length) cleanupErrors.push(`Identidad local ${id}: aún existe o no se pudo verificar`);
  }
  if (cleanupErrors.length) console.error("Limpieza incompleta:", cleanupErrors.join(" | "));
  else console.log("Limpieza de cuentas y archivos de prueba completada.");
}

if (cleanupErrors.length) process.exitCode = 1;
