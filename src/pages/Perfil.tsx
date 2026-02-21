// --- Validación y sanitización ---
type ProfileFormData = {
  nombre_completo: string;
  telefono: string;
  edad: number;
  fecha_nacimiento: string;
  seisena: string;
  patrulla: string;
  equipo_pioneros: string;
  comunidad_rovers: string;
  rol_adulto: string;
  rama_que_educa: string | null;
  password: string;
  avatar_url: string | null;
  username: string;
  username_updated_at: string | null;
};
function validateProfile(data: ProfileFormData) {
  const errors: string[] = [];
  // Nombre obligatorio y sin caracteres peligrosos
  if (!data.nombre_completo.trim()) errors.push("El nombre completo es obligatorio.");
  if (/[^\p{L} .'-]/u.test(data.nombre_completo)) errors.push("El nombre contiene caracteres inválidos.");
  // Teléfono: opcional pero si existe debe ser numérico
  if (data.telefono && !/^\+?\d{7,15}$/.test(data.telefono)) errors.push("El teléfono debe ser válido (solo números, puede incluir +).");
  // Fecha de nacimiento: formato YYYY-MM-DD
  if (data.fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_nacimiento)) errors.push("La fecha de nacimiento no es válida.");
  // Username: obligatorio, sin espacios ni caracteres raros
  if (!data.username.trim()) errors.push("El nombre de usuario es obligatorio.");
  if (!/^[a-zA-Z0-9._-]{3,20}$/.test(data.username)) errors.push("El nombre de usuario solo puede tener letras, números, puntos, guiones y guion bajo (3-20 caracteres).");
  // Sanitización básica
  const sanitized = {
    ...data,
    nombre_completo: data.nombre_completo.replace(/[<>"']/g, ""),
    telefono: data.telefono.replace(/[^\d+]/g, ""),
    username: data.username.replace(/[^a-zA-Z0-9._-]/g, ""),
  };
  return { valid: errors.length === 0, errors, sanitized };
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserAvatar from "@/components/UserAvatar";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import { ArrowLeft, Eye, EyeOff, Save, Upload, X, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Database } from "@/integrations/supabase/types";
import { isLocalBackend, uploadImage, getAuthUser, apiFetch } from "@/lib/backend";
import {
  getProfile as getLocalProfile,
  updateProfile as updateLocalProfile,
} from "@/lib/api";

type Tables = Database["public"]["Tables"];
type Profile = Tables["profiles"]["Row"];
type ProfileInsert = Tables["profiles"]["Insert"];
type ProfileUpdate = Tables["profiles"]["Update"];

const Perfil = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const [formData, setFormData] = useState<{
    nombre_completo: string;
    telefono: string;
    edad: number;
    fecha_nacimiento: string;
    seisena: string;
    patrulla: string;
    equipo_pioneros: string;
    comunidad_rovers: string;
    rol_adulto: string;
    rama_que_educa: string | null;
    password: string;
    avatar_url: string | null;
    username: string;
    username_updated_at: string | null;
  }>({
    nombre_completo: "",
    telefono: "",
    edad: 0,
    fecha_nacimiento: "",
    seisena: "",
    patrulla: "",
    equipo_pioneros: "",
    comunidad_rovers: "",
    rol_adulto: "",
    rama_que_educa: null,
    password: "",
    avatar_url: null,
    username: "",
    username_updated_at: null,
  });
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(
    null,
  );
  const [ramaActual, setRamaActual] = useState("");
  const [ramaEducador, setRamaEducador] = useState<"" | "manada" | "tropa" | "pioneros" | "rovers">("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Prevenir cierre/recarga del navegador con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, originalData]);

  // Fecha máxima para el datepicker (hoy) evitando desfases UTC
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Calcular edad automáticamente DESDE fecha de nacimiento (edad no editable)
  useEffect(() => {
    if (formData.fecha_nacimiento) {
      const hoy = new Date();
      // Parsear fecha sin conversión UTC para evitar desfase de dáas
      const [year, month, day] = formData.fecha_nacimiento
        .split("-")
        .map(Number);
      const nacimiento = new Date(year, month - 1, day);
      let años = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        años--;
      }
      setFormData((prev) => ({ ...prev, edad: años }));
    }
  }, [formData.fecha_nacimiento]);

  // Determinar rama actual según edad
  useEffect(() => {
    const edad = formData.edad;
    if (edad >= 21) setRamaActual("Adulto");
    else if (edad >= 18) setRamaActual("Rover");
    else if (edad >= 15) setRamaActual("Pionero");
    else if (edad >= 11) setRamaActual("Tropa");
    else if (edad >= 7) setRamaActual("Manada");
    else setRamaActual("");
  }, [formData.edad]);

  // Detectar rama educador según datos
  useEffect(() => {
    // Si ya hay un valor explácito en rama_que_educa, usarlo
    if (formData.rama_que_educa) {
      setRamaEducador(formData.rama_que_educa as "" | "manada" | "tropa" | "pioneros" | "rovers");
    } else {
      // Fallback: detectar por campos legacy
      if (formData.seisena) setRamaEducador("manada");
      else if (formData.patrulla) setRamaEducador("tropa");
      else if (formData.equipo_pioneros) setRamaEducador("pioneros");
      else if (formData.comunidad_rovers) setRamaEducador("rovers");
      else setRamaEducador("");
    }
  }, [formData.rama_que_educa, formData.seisena, formData.patrulla, formData.equipo_pioneros, formData.comunidad_rovers]);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const auth = await getAuthUser();
      if (!auth) {
        navigate("/auth");
        return;
      }
      setUserEmail(auth.email || "");
      setEmailVerified(auth.email_verified ?? true);

      // Modo local: obtener desde backend propio
      if (isLocalBackend()) {
        const p: any = await getLocalProfile(auth.id).catch(() => null);
        const profileData = {
          ...formData,
          nombre_completo: p?.nombre_completo || "",
          telefono: p?.telefono || "",
          edad: p?.edad || 0,
          fecha_nacimiento: p?.fecha_nacimiento
            ? p.fecha_nacimiento.split("T")[0]
            : "",
          seisena: p?.seisena || "",
          patrulla: p?.patrulla || "",
          equipo_pioneros: p?.equipo_pioneros || "",
          comunidad_rovers: p?.comunidad_rovers || "",
          rol_adulto: p?.rol_adulto || "",
          rama_que_educa: p?.rama_que_educa || null,
          password: "",
          avatar_url: p?.avatar_url || null,
          username: (p as any)?.username || "",
          username_updated_at: (p as any)?.username_updated_at || null,
        };
        setFormData(profileData);
        setOriginalData(profileData);
        return;
      }

      // Supabase (fallback)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", auth.id)
        .single();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      const userMetadata = user?.user_metadata || {};
      const userNombre =
        (userMetadata as any).nombre || profile?.nombre_completo || "";
      const userTelefono =
        (userMetadata as any).telefono || profile?.telefono || "";
      if (profile) {
        setProfile(profile as Profile);
        const profileData = {
          ...formData,
          nombre_completo: userNombre,
          telefono: userTelefono,
          edad: (profile as any).edad || 0,
          fecha_nacimiento: (profile as any).fecha_nacimiento
            ? (profile as any).fecha_nacimiento.split("T")[0]
            : "",
          seisena: (profile as any).seisena || "",
          patrulla: (profile as any).patrulla || "",
          equipo_pioneros: (profile as any).equipo_pioneros || "",
          comunidad_rovers: (profile as any).comunidad_rovers || "",
          rol_adulto: (profile as any).rol_adulto || "",
          rama_que_educa: (profile as any).rama_que_educa || null,
          password: "",
          avatar_url: (profile as any).avatar_url || null,
          username: (profile as any).username || "",
          username_updated_at: (profile as any).username_updated_at || null,
        };
        setFormData(profileData);
        setOriginalData(profileData);
      } else {
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: auth.id,
          nombre_completo: userNombre,
          telefono: userTelefono,
        });
        if (insertError) throw insertError;
        await getProfile();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Validación especáfica por campo
    if (name === "telefono") {
      // Solo números y guiones/espacios
      const cleaned = value.replace(/[^\d\s\-+()]/g, "");
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }

    if (name === "edad") {
      const edad = parseInt(value) || 0;
      if (edad < 0 || edad > 120) {
        toast({
          title: "Edad inválida",
          description: "La edad debe estar entre 0 y 120 años",
          variant: "destructive",
        });
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: edad }));
      return;
    }

    if (name === "nombre_completo" && value.length > 50) {
      toast({
        title: "Nombre muy largo",
        description: "El nombre no puede exceder 50 caracteres",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [userEmail, setUserEmail] = useState("");

  // Detectar si hay cambios pendientes
  const hasChanges = () => {
    if (!originalData) return false;
    if (avatarFile) return true; // Hay nuevo avatar
    if (formData.password) return true; // Hay nueva contraseña

    // Comparar campos editables
    return (
      formData.nombre_completo !== originalData.nombre_completo ||
      formData.telefono !== originalData.telefono ||
      formData.edad !== originalData.edad ||
      formData.fecha_nacimiento !== originalData.fecha_nacimiento ||
      formData.seisena !== originalData.seisena ||
      formData.patrulla !== originalData.patrulla ||
      formData.equipo_pioneros !== originalData.equipo_pioneros ||
      formData.comunidad_rovers !== originalData.comunidad_rovers ||
      formData.rol_adulto !== originalData.rol_adulto ||
      formData.rama_que_educa !== originalData.rama_que_educa ||
      formData.username !== originalData.username
    );
  };

  useEffect(() => {
    // Obtener el email del usuario cuando se carga el componente
    (async () => {
      const auth = await getAuthUser();
      if (auth?.email) setUserEmail(auth.email);
    })();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten imágenes (JPG, PNG, GIF, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      });
      return;
    }

    // Crear preview temporal para el crop
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageSrc(reader.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);

    // Resetear el input para permitir seleccionar el mismo archivo
    e.target.value = "";
  };

  const handleCropComplete = (croppedImage: Blob) => {
    // Convertir blob a file
    const fileName = `avatar-${Date.now()}.jpg`;
    const croppedFile = new File([croppedImage], fileName, {
      type: "image/jpeg",
    });

    setAvatarFile(croppedFile);
    setCroppedBlob(croppedImage);

    // Crear preview del crop
    const previewUrl = URL.createObjectURL(croppedImage);
    setAvatarPreview(previewUrl);
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      setUploadingAvatar(true);
      if (isLocalBackend()) {
        // Subir al backend local
        const url = await uploadImage(avatarFile);
        return url;
      }

      // Supabase storage
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error al subir imagen",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setCroppedBlob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar y sanear datos antes de guardar
    const { valid, errors, sanitized } = validateProfile(formData);
    if (!valid) {
      toast({
        title: "Error en el formulario",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const auth = await getAuthUser();
      if (!auth) throw new Error("No hay sesión activa");

      // Subir avatar si hay uno nuevo
      let avatarUrl = sanitized.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(auth.id);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Actualizar contraseña: solo soportado en Supabase
      if (!isLocalBackend() && sanitized.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: sanitized.password,
        });
        if (passwordError) throw passwordError;
      }

      // Preparar datos de perfil
      const profileData: any = {
        user_id: auth.id,
        nombre_completo: sanitized.nombre_completo,
        telefono: sanitized.telefono,
        edad: sanitized.edad,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      // Agregar username si se proporcionó
      if (sanitized.username && sanitized.username.trim()) {
        profileData.username = sanitized.username.trim().toLowerCase();
      }

      // Solo agregar campos si existen en la base de datos
      if (sanitized.fecha_nacimiento) {
        profileData.fecha_nacimiento = sanitized.fecha_nacimiento;
      }

      if (sanitized.edad >= 7 && sanitized.edad <= 20) {
        profileData.seisena = sanitized.seisena || null;
      }

      if (sanitized.edad >= 11 && sanitized.edad <= 20) {
        profileData.patrulla = sanitized.patrulla || null;
      }

      if (sanitized.edad >= 15 && sanitized.edad <= 20) {
        profileData.equipo_pioneros = sanitized.equipo_pioneros || null;
      }

      if (sanitized.edad >= 18 && sanitized.edad <= 20) {
        profileData.comunidad_rovers = sanitized.comunidad_rovers || null;
      }

      if (sanitized.edad >= 21 && sanitized.rol_adulto) {
        profileData.rol_adulto = sanitized.rol_adulto;
      }

      // Permitir a Adultos Educadores guardar sus unidades a cargo
      if (sanitized.edad >= 21 && sanitized.rol_adulto === "Educador/a") {
        profileData.seisena = sanitized.seisena || null;
        profileData.patrulla = sanitized.patrulla || null;
        profileData.equipo_pioneros = sanitized.equipo_pioneros || null;
        profileData.comunidad_rovers = sanitized.comunidad_rovers || null;
        profileData.rama_que_educa = sanitized.rama_que_educa || null;
      }

      if (isLocalBackend()) {
        const updated = (await updateLocalProfile(profileData as any)) as any;
        if (updated) {
          // Aplicar respuesta del backend directamente para evitar parpadeos
          const refreshed = {
            ...formData,
            nombre_completo: updated?.nombre_completo || formData.nombre_completo,
            telefono: updated?.telefono ?? formData.telefono,
            fecha_nacimiento: updated?.fecha_nacimiento
              ? String(updated.fecha_nacimiento).split("T")[0]
              : formData.fecha_nacimiento,
            rol_adulto: updated?.rol_adulto ?? formData.rol_adulto,
            seisena: updated?.seisena ?? formData.seisena,
            patrulla: updated?.patrulla ?? formData.patrulla,
            equipo_pioneros: updated?.equipo_pioneros ?? formData.equipo_pioneros,
            comunidad_rovers: updated?.comunidad_rovers ?? formData.comunidad_rovers,
            avatar_url: updated?.avatar_url ?? avatarUrl,
            username: updated?.username ?? formData.username,
            username_updated_at:
              updated?.username_updated_at ?? formData.username_updated_at,
          };
          setFormData(refreshed);
          setOriginalData(refreshed);
        }
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("user_id", auth.id);
        if (profileError) throw profileError;
      }

      toast({
        title: "¡Perfil actualizado!",
        description: "Tus cambios han sido guardados.",
      });

  // Recargar perfil desde servidor para reflejar cambios (sin mostrar loading)
  if (!isLocalBackend()) await getProfile(false);

      // Limpiar estados temporales
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!isLocalBackend()) {
      toast({
        title: "No disponible",
        description: "La verificación de email solo está disponible en modo local",
        variant: "destructive",
      });
      return;
    }

    try {
      setResendingEmail(true);
      await apiFetch("/auth/resend-verification", { method: "POST" });
      toast({
        title: "✉️ Email enviado",
        description: "Revisa tu correo para verificar tu cuenta",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el email",
        variant: "destructive",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background/60 backdrop-blur-sm">
        {/* Navigation global en App.tsx */}
        <div className="h-20"></div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      {/* Navigation global en App.tsx */}
      <div className="h-20"></div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (hasChanges()) {
                setShowUnsavedDialog(true);
                setPendingNavigation("/perfil");
              } else {
                navigate("/perfil");
              }
            }}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Editar perfil</h1>
            <p className="text-sm text-muted-foreground">
              Actualiza tu información personal y scout
            </p>
          </div>
        </div>

        {/* Email Verification Banner */}
        {!emailVerified && isLocalBackend() && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Email no verificado
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Revisa tu correo y haz clic en el enlace de verificación.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendVerificationEmail}
                disabled={resendingEmail}
                className="gap-2 shrink-0"
              >
                <Mail className="h-4 w-4" />
                {resendingEmail ? "Enviando..." : "Reenviar email"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b">
          <div className="relative">
            <UserAvatar
              avatarUrl={avatarPreview || formData.avatar_url}
              userName={formData.nombre_completo}
              size="xl"
            />
            {avatarPreview && (
              <button
                onClick={removeAvatarPreview}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-medium mb-1">
              {formData.nombre_completo || "Usuario Scout"}
            </h2>
            <p className="text-sm text-muted-foreground mb-3">{userEmail}</p>
            <div className="flex gap-2 justify-center sm:justify-start">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 text-foreground rounded-md hover:bg-muted/40 transition-colors text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  {formData.avatar_url ? "Cambiar foto" : "Subir foto"}
                </div>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {formData.avatar_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const auth = await getAuthUser();
                      if (!auth) return;

                      if (isLocalBackend()) {
                        await updateLocalProfile({
                          user_id: auth.id,
                          avatar_url: null,
                        } as any);
                      } else {
                        await supabase
                          .from("profiles")
                          .update({ avatar_url: null })
                          .eq("user_id", auth.id);
                      }

                      setFormData((prev) => ({ ...prev, avatar_url: null }));
                      setOriginalData((prev) =>
                        prev ? { ...prev, avatar_url: null } : prev,
                      );
                      toast({
                        title: "Foto eliminada",
                        description: "Tu foto de perfil ha sido eliminada",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Eliminar foto
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG o GIF. Máximo 4MB
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos personales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Personal</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre completo *</Label>
                <Input
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className={`bg-background ${
                    formData.nombre_completo.length > 0 &&
                    formData.nombre_completo.length < 3
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {formData.nombre_completo.length > 0 &&
                  formData.nombre_completo.length < 3 && (
                    <p className="text-xs text-destructive">
                      Mánimo 3 caracteres
                    </p>
                  )}
                {formData.nombre_completo.length > 90 && (
                  <p className="text-xs text-muted-foreground">
                    {100 - formData.nombre_completo.length} caracteres restantes
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  Nombre de usuario
                  {formData.username_updated_at &&
                    (() => {
                      const lastUpdate = new Date(formData.username_updated_at);
                      const daysSince = Math.floor(
                        (Date.now() - lastUpdate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const daysRemaining = 7 - daysSince;

                      if (daysRemaining > 0) {
                        return (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            (podrás cambiar en {daysRemaining} dáa
                            {daysRemaining !== 1 ? "s" : ""})
                          </span>
                        );
                      }
                      return (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                          (puedes cambiar ahora)
                        </span>
                      );
                    })()}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9._-]/g, "");
                      setFormData((prev) => ({ ...prev, username: value }));
                    }}
                    placeholder="usuario.ejemplo"
                    pattern="[a-z0-9._-]{3,30}"
                    minLength={3}
                    maxLength={30}
                    className="bg-background pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  3-30 caracteres. Solo letras, números, puntos, guiones.
                  {formData.username.length > 0 &&
                    formData.username.length < 3 && (
                      <span className="block text-destructive mt-1">
                        Mánimo 3 caracteres
                      </span>
                    )}
                  {!formData.username && " Solo se puede cambiar cada 7 dáas."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento *</Label>
                <Input
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className="bg-background"
                  required
                  max={maxDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  name="edad"
                  type="number"
                  value={formData.edad || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rama_actual">Rama actual</Label>
                <Input
                  id="rama_actual"
                  type="text"
                  value={ramaActual}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={userEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Nueva contraseña (opcional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Dejar vacáo para mantener"
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Datos Scout */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Scout</h3>

            <div className="grid gap-4 md:grid-cols-2">
              {formData.edad >= 7 && formData.edad <= 20 && (
                <div className="space-y-2">
                  <Label htmlFor="seisena">Seisena (Manada)</Label>
                  <Input
                    id="seisena"
                    name="seisena"
                    value={formData.seisena}
                    onChange={handleChange}
                    placeholder="Ej: Seisena Roja"
                    className="bg-background"
                  />
                </div>
              )}

              {formData.edad >= 11 && formData.edad <= 20 && (
                <div className="space-y-2">
                  <Label htmlFor="patrulla">Patrulla (Tropa)</Label>
                  <Input
                    id="patrulla"
                    name="patrulla"
                    value={formData.patrulla}
                    onChange={handleChange}
                    placeholder="Ej: Patrulla Halcón"
                    className="bg-background"
                  />
                </div>
              )}

              {formData.edad >= 15 && formData.edad <= 20 && (
                <div className="space-y-2">
                  <Label htmlFor="equipo_pioneros">Equipo de Pioneros</Label>
                  <Input
                    id="equipo_pioneros"
                    name="equipo_pioneros"
                    value={formData.equipo_pioneros}
                    onChange={handleChange}
                    placeholder="Ej: Equipo Alpha"
                    className="bg-background"
                  />
                </div>
              )}

              {formData.edad >= 18 && formData.edad <= 20 && (
                <div className="space-y-2">
                  <Label htmlFor="comunidad_rovers">Comunidad Rovers</Label>
                  <Input
                    id="comunidad_rovers"
                    name="comunidad_rovers"
                    value={formData.comunidad_rovers}
                    onChange={handleChange}
                    placeholder="Ej: Comunidad Caminantes"
                    className="bg-background"
                  />
                </div>
              )}

              {formData.edad >= 21 && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rol_adulto">Rol en el grupo</Label>
                  <select
                    id="rol_adulto"
                    name="rol_adulto"
                    value={formData.rol_adulto}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="No educador/a">No educador/a</option>
                    <option value="Educador/a">Educador/a</option>
                    <option value="Miembro del Comité">
                      Miembro del Comité
                    </option>
                    <option value="Familiar de Scout">Familiar de Scout</option>
                  </select>
                </div>
              )}
            </div>

            {formData.edad >= 21 && formData.rol_adulto === "Educador/a" && (
              <div className="mt-6 space-y-4 p-4 border rounded-md bg-muted/30">
                <h4 className="font-semibold text-base">Información del Educador</h4>
                <p className="text-xs text-muted-foreground">
                  Selecciona la rama que diriges y proporciona información de tu unidad.
                </p>
                <div className="space-y-4">
                  {/* Selector principal de rama */}
                  <div className="space-y-2">
                    <Label htmlFor="rama_que_educa">¿Qué rama diriges?</Label>
                    <select
                      id="rama_que_educa"
                      name="rama_que_educa"
                      value={formData.rama_que_educa || ""}
                      onChange={(e) => {
                        const rama = e.target.value || null;
                        setFormData(prev => ({
                          ...prev,
                          rama_que_educa: rama,
                        }));
                        // Actualizar ramaEducador state para UI
                        setRamaEducador(rama as "" | "manada" | "tropa" | "pioneros" | "rovers");
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Selecciona una rama</option>
                      <option value="manada">🐺 Manada (7-10 años)</option>
                      <option value="tropa">⚜️ Tropa (11-14 años)</option>
                      <option value="pioneros">🏔️ Pioneros (15-17 años)</option>
                      <option value="rovers">🚶 Rovers (18-20 años)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Selecciona la rama principal en la que trabajas como educador/a
                    </p>
                  </div>

                  {/* Campos especáficos según la rama */}
                  {ramaEducador === "manada" && (
                    <div className="space-y-2">
                      <Label htmlFor="seisena_educador">Seisena de Manada (opcional)</Label>
                      <Input
                        id="seisena_educador"
                        name="seisena"
                        value={formData.seisena}
                        onChange={handleChange}
                        placeholder="Ej: Seisena Roja, Seisena Azul..."
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nombre de la seisena que coordinas en Manada
                      </p>
                    </div>
                  )}

                  {ramaEducador === "tropa" && (
                    <div className="space-y-2">
                      <Label htmlFor="patrulla_educador">Patrulla de Tropa (opcional)</Label>
                      <Input
                        id="patrulla_educador"
                        name="patrulla"
                        value={formData.patrulla}
                        onChange={handleChange}
                        placeholder="Ej: Patrulla Halcón, Patrulla Águila..."
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nombre de la patrulla que coordinas en Tropa
                      </p>
                    </div>
                  )}

                  {ramaEducador === "pioneros" && (
                    <div className="space-y-2">
                      <Label htmlFor="pioneros_educador">Equipo de Pioneros (opcional)</Label>
                      <Input
                        id="pioneros_educador"
                        name="equipo_pioneros"
                        value={formData.equipo_pioneros}
                        onChange={handleChange}
                        placeholder="Ej: Equipo Alpha, Equipo Beta..."
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nombre del equipo que coordinas en Pioneros
                      </p>
                    </div>
                  )}

                  {ramaEducador === "rovers" && (
                    <div className="space-y-2">
                      <Label htmlFor="rovers_educador">Comunidad Rovers (opcional)</Label>
                      <Input
                        id="rovers_educador"
                        name="comunidad_rovers"
                        value={formData.comunidad_rovers}
                        onChange={handleChange}
                        placeholder="Ej: Comunidad Caminantes, Clan Rovers..."
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nombre de la comunidad que coordinas en Rovers
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción - Sticky en móvil */}
          <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-4 -mx-4 sm:mx-0 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 z-10 mt-4">
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 gap-2 h-12 text-base font-semibold shadow-lg sm:shadow-none"
                disabled={saving || !hasChanges()}
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {hasChanges() ? "Guardar cambios" : "Sin cambios"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => {
                  if (hasChanges()) {
                    setShowUnsavedDialog(true);
                    setPendingNavigation("/perfil");
                  } else {
                    navigate("/perfil");
                  }
                }}
              >
                Cancelar
              </Button>
            </div>

            {hasChanges() && (
              <div className="mt-3 p-3 bg-muted/30 border border-primary/20 rounded-md animate-pulse">
                <p className="text-sm text-primary font-medium text-center">
                  ⚠️ Tienes cambios sin guardar
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Diálogo de confirmación para cambios sin guardar */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en tu perfil. Si continúas, se perderán todos los cambios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false);
              setPendingNavigation(null);
            }}>
              Seguir editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedDialog(false);
                if (pendingNavigation) {
                  navigate(pendingNavigation);
                  setPendingNavigation(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={showCropDialog}
        imageSrc={tempImageSrc}
        onClose={() => setShowCropDialog(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Perfil;


