import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "lagerfeuer-files";

async function requireLagerfeuerSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesion para acceder a Am Lagerfeuer");
  }

  return user;
}

export type LagerfeuerFile = {
  año: number;
  fecha: string;
  tema: string;
  editores: string;
  url: string;
  path: string;
  fileName: string;
};

export async function listLagerfeuerFiles(): Promise<LagerfeuerFile[]> {
  await requireLagerfeuerSession();

  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list("", {
      sortBy: { column: "name", order: "desc" },
    });

  if (error) throw error;
  if (!files || files.length === 0) return [];

  const result: LagerfeuerFile[] = [];

  for (const file of files) {
    if (file.name === ".emptyFolderPlaceholder") continue;

    const { data, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(file.name, 60 * 60);

    if (signedError || !data?.signedUrl) {
      continue;
    }

    // Extraer año del nombre del archivo (ej: "1967-01.pdf" -> 1967)
    const match = file.name.match(/^(\d{4})/);
    const año = match ? parseInt(match[1]) : 0;

    // Extraer información del nombre del archivo
    // Formato esperado: "YYYY-NN-descripcion.pdf"
    const parts = file.name.replace(".pdf", "").split("-");
    
    result.push({
      año,
      fecha: `${año}`,
      tema: parts.slice(2).join(" ") || "Am Lagerfeuer",
      editores: "", // Se puede agregar metadata después
      url: data.signedUrl,
      path: file.name,
      fileName: file.name,
    });
  }

  return result.sort((a, b) => b.año - a.año);
}

export async function uploadLagerfeuerFile(file: File): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // Verificar que el usuario sea admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol_adulto")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.rol_adulto !== "admin") {
    throw new Error("Solo los administradores pueden subir archivos");
  }

  const fileName = file.name;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;
}

export async function deleteLagerfeuerFile(filePath: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // Verificar que el usuario sea admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol_adulto")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.rol_adulto !== "admin") {
    throw new Error("Solo los administradores pueden eliminar archivos");
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
}
