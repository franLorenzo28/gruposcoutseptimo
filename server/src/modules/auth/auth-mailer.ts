import nodemailer from "nodemailer";
import type { EnvironmentConfig } from "../../config/environment.js";

export type AuthMailKind = "verification" | "password-reset";
export type AuthMailer = (email: string, token: string, kind: AuthMailKind) => Promise<void>;

export function authActionUrl(config: EnvironmentConfig, token: string, kind: AuthMailKind): string {
  const url = new URL(kind === "verification" ? "/verificar-email" : "/interno/restablecer-password", config.APP_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

export function createAuthMailer(config: EnvironmentConfig): AuthMailer {
  const transport = config.SMTP_HOST && config.SMTP_FROM
    ? nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        requireTLS: config.NODE_ENV === "production" && !config.SMTP_SECURE,
        auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
        connectionTimeout: 5_000,
        greetingTimeout: 5_000,
        socketTimeout: 10_000,
      })
    : null;

  return async (email, token, kind) => {
    if (!transport) {
      if (config.NODE_ENV === "production") throw new Error("SMTP no configurado");
      return;
    }
    const subject = kind === "verification" ? "Verifica tu correo — Grupo Scout Séptimo" : "Restablece tu contraseña — Grupo Scout Séptimo";
    const url = authActionUrl(config, token, kind);
    await transport.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject,
      text: `${subject}\n\nAbre este enlace para continuar:\n${url}\n\nEl enlace es de un solo uso. Si no solicitaste esta acción, ignora este correo.`,
    });
  };
}
