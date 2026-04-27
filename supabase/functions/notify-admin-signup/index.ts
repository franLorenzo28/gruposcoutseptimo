// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const user = payload?.user || payload?.record || null;
    const email = String(user?.email || "").trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing user email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    if (!serviceKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: "Missing Supabase service credentials" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("email, role")
      .or("role.ilike.%admin%,role.ilike.%mod%")
      .or("email.ilike.%@admin%,email.ilike.%grupo-scout%,email.eq.franciscolorenzo2406@gmail.com");

    if (adminsError) {
      throw adminsError;
    }

    const adminEmails = Array.from(
      new Set(
        (admins || [])
          .map((row) => String(row.email || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No admin recipients" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fullName = [
      user?.user_metadata?.nombre,
      user?.user_metadata?.apellido,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");

    const tipoRelacion = String(user?.user_metadata?.tipo_relacion || "").trim();
    const rama = String(user?.user_metadata?.rama || "").trim();
    const relatedScout = String(user?.user_metadata?.nombre_scout_relacionado || "").trim();

    const subject = "Nuevo registro pendiente";
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
    const details = [
      fullName || "Nuevo usuario",
      email ? `(${email})` : "",
      tipoRelacion ? `Tipo: ${tipoRelacion}` : "",
      rama ? `Rama: ${rama}` : "",
      relatedScout ? `Relacionado: ${relatedScout}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ ok: true, message: "RESEND_API_KEY no configurado" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") || "Grupo Scout <noreply@tudominio.com>";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmails,
        subject,
        html: `
          <h2>Nuevo registro pendiente</h2>
          <p>${details}</p>
          <p>Revisar solicitudes: <a href="${appUrl}/admin">Panel Admin</a></p>
        `,
        text: `Nuevo registro pendiente: ${details}\nRevisar solicitudes: ${appUrl}/admin`,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      throw new Error(`Error enviando email: ${errorText}`);
    }

    return new Response(JSON.stringify({ ok: true, sent: adminEmails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = (error as any)?.message || "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
