import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch, uploadImage } from "@/lib/backend";
import { ensureAdminForMediaUpload } from "@/lib/admin-permissions";

export type GroupRole = "owner" | "admin" | "member";

export type Group = {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
};

export type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export type GroupWithMemberCount = Group & {
  member_count?: number;
  user_role?: GroupRole;
};

export type GroupMessageWithSender = GroupMessage & {
  sender_name?: string | null;
  sender_username?: string | null;
  sender_avatar?: string | null;
};

// Listar todos los grupos
export async function listGroups(): Promise<GroupWithMemberCount[]> {
  if (isLocalBackend()) {
    const groups = await apiFetch("/groups");
    return (groups as any[]).map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? null,
      cover_image: g.cover_url ?? null,
      creator_id: g.creator_id,
      created_at: g.created_at,
      updated_at: g.updated_at,
      member_count: undefined,
      user_role: g.my_role ?? undefined,
    }));
  }
  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Obtener conteo de miembros y rol del usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const enriched = await Promise.all(
    (groups || []).map(async (group) => {
      // Contar miembros
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      // Obtener rol del usuario si es miembro
      let userRole: GroupRole | undefined;
      if (user) {
        const { data: membership } = await supabase
          .from("group_members")
          .select("role")
          .eq("group_id", group.id)
          .eq("user_id", user.id)
          .maybeSingle();

        userRole = membership?.role as GroupRole | undefined;
      }

      return {
        ...group,
        member_count: count || 0,
        user_role: userRole,
      };
    }),
  );

  return enriched;
}

// Crear grupo
export async function createGroup(
  name: string,
  description: string | null,
  coverImage?: File,
): Promise<Group> {
  if (isLocalBackend()) {
    let cover_url: string | undefined;
    if (coverImage) {
      cover_url = await uploadImage(coverImage);
    }
    const group = await apiFetch("/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, cover_url }),
    });
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      cover_image: group.cover_url ?? null,
      creator_id: group.creator_id,
      created_at: group.created_at,
      updated_at: group.updated_at,
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Validaciones
  if (!name.trim() || name.length < 3) {
    throw new Error("El nombre del grupo debe tener al menos 3 caracteres");
  }
  if (name.length > 100) {
    throw new Error("El nombre del grupo no puede exceder 100 caracteres");
  }
  if (description && description.length > 500) {
    throw new Error("La descripción no puede exceder 500 caracteres");
  }

  let coverImageUrl: string | null = null;

  // Subir imagen de portada si existe
  if (coverImage) {
    await ensureAdminForMediaUpload();

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(coverImage.type)) {
      throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)");
    }

    const maxSize = 5 * 1024 * 1024;
    if (coverImage.size > maxSize) {
      throw new Error("La imagen no puede superar 5MB");
    }

    const ext = coverImage.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("group-covers")
      .upload(fileName, coverImage, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("group-covers")
      .getPublicUrl(fileName);

    coverImageUrl = data.publicUrl;
  }

  // Crear grupo
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      cover_image: coverImageUrl,
      creator_id: user.id,
    })
    .select()
    .single();

  if (groupError) throw groupError;

  return group as Group;
}

// Unirse a un grupo
export async function joinGroup(groupId: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/groups/${groupId}/join`, { method: "POST" });
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
  });

  if (error) throw error;
}

// Salir de un grupo
export async function leaveGroup(groupId: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/groups/${groupId}/leave`, { method: "POST" });
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) throw error;
}

// Listar miembros de un grupo
export async function listGroupMembers(groupId: string) {
  if (isLocalBackend()) {
    const rows = await apiFetch(`/groups/${groupId}/members`);
    return (rows as any[]).map((r) => ({
      user_id: r.user_id,
      role: r.role,
      joined_at: "",
      nombre_completo: r.username,
      username: r.username,
      avatar_url: null,
    }));
  }
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) throw error;

  // Enriquecer con datos de perfil
  const userIds = (data || []).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, nombre_completo, username, avatar_url")
    .in("user_id", userIds);

  return (data || []).map((member) => {
    const profile = profiles?.find((p) => p.user_id === member.user_id);
    return {
      ...member,
      nombre_completo: profile?.nombre_completo,
      username: profile?.username,
      avatar_url: profile?.avatar_url,
    };
  });
}

// Promover a admin
export async function promoteToAdmin(
  groupId: string,
  userId: string,
): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/groups/${groupId}/admins/promote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    return;
  }
  const { error } = await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
}

// Degradar a member
export async function demoteToMember(
  groupId: string,
  userId: string,
): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/groups/${groupId}/admins/demote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    return;
  }
  const { error } = await supabase
    .from("group_members")
    .update({ role: "member" })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
}

// Expulsar miembro
export async function kickMember(
  groupId: string,
  userId: string,
): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
    return;
  }
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
}

// Listar mensajes de grupo
export async function listGroupMessages(
  groupId: string,
): Promise<GroupMessageWithSender[]> {
  if (isLocalBackend()) {
    const rows = await apiFetch(`/groups/${groupId}/messages`);
    return (rows as any[]).map((m: any) => ({
      id: m.id,
      group_id: m.group_id,
      sender_id: m.user_id,
      content: m.content ?? "",
      image_url: m.image_url ?? null,
      created_at: m.created_at,
      sender_name: m.username,
      sender_username: m.username,
      sender_avatar: null,
    }));
  }
  const { data: messages, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Enriquecer con datos del sender
  const senderIds = [...new Set((messages || []).map((m) => m.sender_id))];
  if (senderIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, nombre_completo, username, avatar_url")
    .in("user_id", senderIds);

  return (messages || []).map((msg) => {
    const sender = profiles?.find((p) => p.user_id === msg.sender_id);
    return {
      ...msg,
      sender_name: sender?.nombre_completo,
      sender_username: sender?.username,
      sender_avatar: sender?.avatar_url,
    };
  });
}

// Enviar mensaje al grupo
export async function sendGroupMessage(
  groupId: string,
  content: string,
  image?: File,
): Promise<GroupMessage> {
  if (isLocalBackend()) {
    let image_url: string | undefined;
    if (image) image_url = await uploadImage(image);
    const msg = await apiFetch(`/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, image_url }),
    });
    return {
      id: msg.id,
      group_id: msg.group_id,
      sender_id: msg.user_id,
      content: msg.content ?? "",
      image_url: msg.image_url ?? null,
      created_at: msg.created_at,
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  if (!content.trim() && !image) {
    throw new Error("El mensaje no puede estar vacío");
  }

  let imageUrl: string | null = null;

  // Subir imagen si existe
  if (image) {
    await ensureAdminForMediaUpload();

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(image.type)) {
      throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)");
    }

    const maxSize = 5 * 1024 * 1024;
    if (image.size > maxSize) {
      throw new Error("La imagen no puede superar 5MB");
    }

    const ext = image.name.split(".").pop();
    const fileName = `${groupId}/${Date.now()}.${ext || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("group-covers")
      .upload(fileName, image, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("group-covers")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      group_id: groupId,
      sender_id: user.id,
      content: content.trim(),
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;

  return data as GroupMessage;
}

// Eliminar mensaje
export async function deleteGroupMessage(messageId: string): Promise<void> {
  if (isLocalBackend()) {
    // No endpoint de borrar mensaje en server minimal; omitir.
    throw new Error("No soportado en modo local");
  }
  const { error } = await supabase
    .from("group_messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

// Actualizar grupo (solo admins/owner)
export async function updateGroup(
  groupId: string,
  updates: {
    name?: string;
    description?: string | null;
    cover_image?: File | null;
  },
): Promise<void> {
  if (isLocalBackend()) {
    const payload: any = {};
    if (updates.name !== undefined) {
      if (updates.name.trim().length < 3)
        throw new Error("El nombre debe tener al menos 3 caracteres");
      payload.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > 500)
        throw new Error("La descripción no puede exceder 500 caracteres");
      payload.description = updates.description?.trim() ?? null;
    }
    if (updates.cover_image) {
      const url = await uploadImage(updates.cover_image);
      payload.cover_url = url;
    }
    await apiFetch(`/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return;
  }
  const updateData: any = {};

  if (updates.name !== undefined) {
    if (updates.name.trim().length < 3) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }
    updateData.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    if (updates.description && updates.description.length > 500) {
      throw new Error("La descripción no puede exceder 500 caracteres");
    }
    updateData.description = updates.description?.trim() || null;
  }

  if (updates.cover_image) {
    await ensureAdminForMediaUpload();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(updates.cover_image.type)) {
      throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)");
    }

    const maxSize = 5 * 1024 * 1024;
    if (updates.cover_image.size > maxSize) {
      throw new Error("La imagen no puede superar 5MB");
    }

    const ext = updates.cover_image.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("group-covers")
      .upload(fileName, updates.cover_image, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("group-covers")
      .getPublicUrl(fileName);

    updateData.cover_image = data.publicUrl;
  }

  const { error } = await supabase
    .from("groups")
    .update(updateData)
    .eq("id", groupId);

  if (error) throw error;
}

// (Se mantienen implementaciones más abajo, con soporte para local)

// Eliminar grupo (solo owner)
export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) throw error;
}

// Eliminar grupo y limpiar archivos asociados en storage (portada y fotos de mensajes)
export async function deleteGroupDeep(groupId: string): Promise<void> {
  if (isLocalBackend()) {
    await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
    return;
  }
  // Helper: extraer key de storage desde public URL
  const extractKey = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const marker = "/group-covers/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  // 1) Cargar grupo (para portada) y mensajes con imagen
  const [{ data: group, error: gErr }, { data: msgs, error: mErr }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("cover_image")
        .eq("id", groupId)
        .maybeSingle(),
      supabase
        .from("group_messages")
        .select("image_url")
        .eq("group_id", groupId)
        .not("image_url", "is", null),
    ]);
  if (gErr) throw gErr;
  if (mErr) throw mErr;

  // 2) Calcular keys a borrar
  const keys: string[] = [];
  const coverKey = extractKey(group?.cover_image || null);
  if (coverKey) keys.push(coverKey);
  (msgs || []).forEach((m: any) => {
    const k = extractKey(m.image_url);
    if (k) keys.push(k);
  });

  // 3) Borrar archivos del bucket (ignorar errores parciales)
  if (keys.length > 0) {
    if (isLocalBackend()) {
      // Podemos intentar usar el endpoint /members/invite si los usuarios existen en el backend local.
      // Pero sin mapeo de IDs entre Supabase y local, mejor bloquear para evitar inconsistencias.
      throw new Error("Invitaciones no soportadas en modo local");
    }
    await supabase.storage.from("group-covers").remove(keys);
  }

  // 4) Borrar el grupo (cascada elimina miembros y mensajes)
  await deleteGroup(groupId);
}

// Invitar/agregar miembros (solo owner/admin, RLS lo valida). Ignora duplicados.
export async function inviteMembers(
  groupId: string,
  userIds: string[],
): Promise<{ inserted: number; skipped: number }> {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  // Construir filas únicas
  const uniqueIds = Array.from(new Set(userIds));
  // Obtener ya miembros para evitar duplicados (por RLS solo leeremos si somos miembros; suficiente)
  const { data: existing, error: existingError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .in("user_id", uniqueIds);

  if (existingError) throw existingError;

  const existingIds = new Set((existing || []).map((e) => e.user_id));
  const toInsert = uniqueIds.filter((id) => !existingIds.has(id));

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: uniqueIds.length };
  }

  const rows = toInsert.map((uid) => ({
    group_id: groupId,
    user_id: uid,
    role: "member" as const,
  }));

  const { error, count } = await supabase
    .from("group_members")
    .insert(rows, { count: "exact" });

  if (error) throw error;

  const inserted = count ?? rows.length;
  const skipped = uniqueIds.length - inserted;
  return { inserted, skipped };
}
