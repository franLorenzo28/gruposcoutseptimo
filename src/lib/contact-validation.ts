export type ContactFields = { name: string; email: string; phone: string; message: string };
export function validateContact(fields: ContactFields) {
  const sanitized = {
    name: fields.name.trim(), email: fields.email.trim().toLowerCase(),
    phone: fields.phone.replace(/[\s().-]/g, ""), message: fields.message.trim(),
  };
  const fieldErrors: Partial<Record<keyof ContactFields, string>> = {};
  if (sanitized.name.length < 3) fieldErrors.name = "Escribe tu nombre (al menos 3 caracteres).";
  if (!/^\S+@\S+\.\S+$/.test(sanitized.email)) fieldErrors.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (sanitized.phone && !/^\+?\d{7,15}$/.test(sanitized.phone)) fieldErrors.phone = "Revisa el teléfono: debe tener entre 7 y 15 números.";
  if (sanitized.message.length < 10) fieldErrors.message = "Cuéntanos un poco más (al menos 10 caracteres).";
  return { valid: Object.keys(fieldErrors).length === 0, errors: Object.values(fieldErrors), fieldErrors, sanitized };
}
