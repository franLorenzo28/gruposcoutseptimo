import { db } from "./db";
import { sendNotificationEmail } from "./email-service";

function safeParsePreferences(raw: unknown): Record<string, boolean> {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export async function maybeSendNotificationEmail(
  recipientId: string,
  title: string,
  description: string,
): Promise<void> {
  const userRow = db
    .prepare("SELECT email, email_verified_at FROM users WHERE id = ?")
    .get(recipientId) as { email?: string | null; email_verified_at?: string | null } | undefined;

  if (!userRow?.email) return;
  if (!userRow.email_verified_at) return;

  const profileRow = db
    .prepare("SELECT notification_preferences FROM profiles WHERE user_id = ?")
    .get(recipientId) as { notification_preferences?: string | null } | undefined;

  const prefs = safeParsePreferences(profileRow?.notification_preferences || null);
  if (prefs.email_notificaciones === false) return;

  await sendNotificationEmail(userRow.email, title, description);
}
