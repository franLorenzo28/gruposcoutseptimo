/**
 * Esquemas de validación con Zod para formularios
 * Proporciona validación type-safe tanto en frontend como backend
 */

import { z } from "zod";

// Mensajes de error personalizados en español
const errorMessages = {
  required: "Este campo es obligatorio",
  email: "Email inválido",
  minLength: (min: number) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max: number) => `No debe exceder ${max} caracteres`,
  min: (min: number) => `Debe ser al menos ${min}`,
  max: (max: number) => `No debe ser mayor a ${max}`,
  url: "URL inválida",
  date: "Fecha inválida",
  phone: "Número de teléfono inválido",
};

/**
 * Validación de perfil de usuario
 */
export const profileSchema = z.object({
  nombre_completo: z
    .string({ required_error: errorMessages.required })
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100)),

  username: z
    .string({ required_error: errorMessages.required })
    .min(3, errorMessages.minLength(3))
    .max(30, errorMessages.maxLength(30))
    .regex(/^[a-zA-Z0-9_-]+$/, "Solo letras, números, guiones y guiones bajos"),

  fecha_nacimiento: z
    .string()
    .refine(
      (date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      { message: errorMessages.date },
    )
    .refine(
      (date) => {
        const today = new Date();
        const birthDate = new Date(date);
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 5 && age <= 120;
      },
      { message: "La edad debe estar entre 5 y 120 años" },
    )
    .optional(),

  rol_adulto: z
    .string()
    .max(50, errorMessages.maxLength(50))
    .optional()
    .nullable(),

  is_public: z.boolean().optional(),

  bio: z.string().max(500, errorMessages.maxLength(500)).optional().nullable(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Validación de email
 */
export const emailSchema = z.object({
  email: z
    .string({ required_error: errorMessages.required })
    .email(errorMessages.email)
    .max(254, errorMessages.maxLength(254)),
});

export type EmailFormData = z.infer<typeof emailSchema>;

/**
 * Validación de contraseña
 */
export const passwordSchema = z
  .object({
    password: z
      .string({ required_error: errorMessages.required })
      .min(8, errorMessages.minLength(8))
      .max(128, errorMessages.maxLength(128))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener al menos una mayúscula, una minúscula y un número",
      ),
    confirmPassword: z.string({ required_error: errorMessages.required }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

/**
 * Validación de registro
 */
export const registerSchema = z
  .object({
    email: emailSchema.shape.email,
    password: z
      .string({ required_error: errorMessages.required })
      .min(8, errorMessages.minLength(8))
      .max(128, errorMessages.maxLength(128))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener al menos una mayúscula, una minúscula y un número",
      ),
    confirmPassword: z.string({ required_error: errorMessages.required }),
    nombre_completo: profileSchema.shape.nombre_completo,
    username: profileSchema.shape.username,
    terms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Validación de login
 */
export const loginSchema = z.object({
  email: emailSchema.shape.email,
  password: z
    .string({ required_error: errorMessages.required })
    .min(1, errorMessages.required),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Validación de mensaje
 */
export const messageSchema = z.object({
  content: z
    .string({ required_error: errorMessages.required })
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, errorMessages.maxLength(2000)),
});

export type MessageFormData = z.infer<typeof messageSchema>;

/**
 * Validación de grupo
 */
export const groupSchema = z.object({
  name: z
    .string({ required_error: errorMessages.required })
    .min(3, errorMessages.minLength(3))
    .max(50, errorMessages.maxLength(50)),

  description: z
    .string()
    .max(500, errorMessages.maxLength(500))
    .optional()
    .nullable(),

  is_private: z.boolean().optional(),
});

export type GroupFormData = z.infer<typeof groupSchema>;

/**
 * Validación de evento
 */
export const eventSchema = z.object({
  title: z
    .string({ required_error: errorMessages.required })
    .min(3, errorMessages.minLength(3))
    .max(100, errorMessages.maxLength(100)),

  description: z
    .string()
    .max(1000, errorMessages.maxLength(1000))
    .optional()
    .nullable(),

  event_date: z
    .string({ required_error: errorMessages.required })
    .refine((date) => !isNaN(new Date(date).getTime()), {
      message: errorMessages.date,
    }),

  location: z
    .string()
    .max(200, errorMessages.maxLength(200))
    .optional()
    .nullable(),
});

export type EventFormData = z.infer<typeof eventSchema>;

/**
 * Validación de archivo de imagen
 */
export const imageFileSchema = z.custom<File>((file) => {
  if (!(file instanceof File)) return false;

  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)");
  }

  if (file.size > maxSize) {
    throw new Error("La imagen no debe superar 5MB");
  }

  return true;
});

/**
 * Validación de URL
 */
export const urlSchema = z.object({
  url: z
    .string({ required_error: errorMessages.required })
    .url(errorMessages.url),
});

export type UrlFormData = z.infer<typeof urlSchema>;

/**
 * Helper para validar datos con Zod
 * Retorna { success: true, data } o { success: false, errors }
 */
export function validate<T extends z.ZodSchema>(
  schema: T,
  data: unknown,
):
  | { success: true; data: z.infer<T>; errors: null }
  | { success: false; data: null; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: null };
  } else {
    return { success: false, data: null, errors: result.error };
  }
}

/**
 * Helper para obtener el primer error de un campo
 */
export function getFieldError(
  errors: z.ZodError | null,
  fieldName: string,
): string | undefined {
  if (!errors) return undefined;

  const fieldError = errors.errors.find(
    (err) => err.path.join(".") === fieldName,
  );

  return fieldError?.message;
}

/**
 * Helper para obtener todos los errores en formato { field: message }
 */
export function getFormErrors(
  errors: z.ZodError | null,
): Record<string, string> {
  if (!errors) return {};

  return errors.errors.reduce(
    (acc, err) => {
      const path = err.path.join(".");
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Validación de bloque de narrativa
 */
export const narrativaBloqueSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(["texto", "imagen"]),
  contenido: z
    .string({ required_error: errorMessages.required })
    .min(1, "El contenido no puede estar vacío"),
});

export type NarrativaBloqueFormData = z.infer<typeof narrativaBloqueSchema>;

/**
 * Validación de narrativa (relato histórico)
 */
export const narrativaSchema = z.object({
  titulo: z
    .string({ required_error: errorMessages.required })
    .min(5, errorMessages.minLength(5))
    .max(200, errorMessages.maxLength(200)),

  year_section: z
    .string({ required_error: errorMessages.required })
    .min(4, "Debe ingresar un año (ej: 1964 o JUN-1964)")
    .max(20, errorMessages.maxLength(20)),

  fecha_publicacion: z
    .string({ required_error: errorMessages.required })
    .refine(
      (date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      { message: errorMessages.date },
    ),

  bloques: z
    .array(narrativaBloqueSchema)
    .min(1, "Debe agregar al menos un bloque")
    .max(50, "No se pueden agregar más de 50 bloques"),
});

export type NarrativaFormData = z.infer<typeof narrativaSchema>;
