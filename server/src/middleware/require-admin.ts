import { db } from "../db";
import { authMiddleware } from "../auth";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email.toLowerCase());
}

export function requireLocalAdmin(req: any, res: any, next: any) {
  return authMiddleware(req, res, () => {
    const userId = req.user?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const user = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as
      | { email?: string | null }
      | undefined;
    if (!user || !isAdminEmail(user.email)) {
      return res.status(403).json({ error: "Se requieren permisos de administrador" });
    }

    return next();
  });
}
