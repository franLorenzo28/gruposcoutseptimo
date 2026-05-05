// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTACT_RECIPIENT = "paginawebseptimo@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { name, email, phone, message } = await req.json();

    // Validación básica del lado del servidor
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Nombre, email y mensaje son obligatorios." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (typeof name !== "string" || name.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "El nombre debe tener al menos 3 caracteres." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "El email no es válido." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (typeof message !== "string" || message.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "El mensaje debe tener al menos 10 caracteres." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Sanitizar
    const safeName = String(name).trim().replace(/[<>"']/g, "");
    const safeEmail = String(email).trim().toLowerCase();
    const safePhone = phone ? String(phone).replace(/[^\d+\s()-]/g, "") : "";
    const safeMessage = String(message).trim().replace(/[<>"']/g, "");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY no configurado, no se puede enviar email");
      return new Response(
        JSON.stringify({ ok: true, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") || "Grupo Scout <noreply@tudominio.com>";
    const appUrl = Deno.env.get("APP_URL") || "https://gruposcout7.com";

    const subject = `Nuevo mensaje de contacto - ${safeName}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2d5a88); padding: 24px 32px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
            📬 Nuevo mensaje de contacto
          </h1>
          <p style="color: #cbd5e1; margin: 8px 0 0; font-size: 14px;">
            Formulario de contacto · ${appUrl}
          </p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #374151; width: 120px; vertical-align: top;">Nombre:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #374151; vertical-align: top;">Email:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none;">${safeEmail}</a>
              </td>
            </tr>
            ${safePhone ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #374151; vertical-align: top;">Teléfono:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${safePhone}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; vertical-align: top;">Mensaje:</td>
              <td style="padding: 12px 0; color: #1f2937; white-space: pre-wrap; line-height: 1.6;">${safeMessage}</td>
            </tr>
          </table>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de contacto del sitio web del Grupo Scout Séptimo.
          </p>
        </div>
      </div>
    `;

    const textBody = [
      `Nuevo mensaje de contacto`,
      ``,
      `Nombre: ${safeName}`,
      `Email: ${safeEmail}`,
      safePhone ? `Teléfono: ${safePhone}` : null,
      ``,
      `Mensaje:`,
      safeMessage,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [CONTACT_RECIPIENT],
        reply_to: safeEmail,
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Resend error:", errorText);
      throw new Error(`Error enviando email: ${errorText}`);
    }

    const result = await emailRes.json();
    console.log("Email enviado:", result);

    return new Response(
      JSON.stringify({ ok: true, message: "Mensaje enviado correctamente" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    const message = (error as any)?.message || "Error desconocido";
    console.error("send-contact-form error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
