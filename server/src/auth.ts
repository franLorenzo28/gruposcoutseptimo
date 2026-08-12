import jwt from "jsonwebtoken";

const configuredSecret = process.env.JWT_SECRET?.trim();

if (process.env.NODE_ENV === "production" && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error("JWT_SECRET debe estar configurado y tener al menos 32 caracteres en producción");
}

const JWT_SECRET = configuredSecret || "local-development-secret-change-me";

export type AuthPayload = {
  userId: string;
};

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers?.authorization as string | undefined;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = { id: decoded.userId };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}
