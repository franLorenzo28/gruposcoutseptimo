import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { AppError } from "../../core/errors.js";
import {
  emailRegistrationSchema,
  registrationDecisionSchema,
  registrationIdParamsSchema,
  registrationListQuerySchema,
  registrationProfileSchema,
  type RegistrationProfileInput,
} from "./registration.schemas.js";

const publicAccepted = {
  accepted: true,
  message: "Si los datos son válidos, la solicitud quedará pendiente de revisión.",
};

function requireAdminClient(app: FastifyInstance) {
  if (!app.supabaseAdmin) {
    throw new AppError(503, "ADMIN_DATABASE_NOT_CONFIGURED", "El servicio de registro no está disponible.");
  }
  return app.supabaseAdmin;
}

function registrationRow(input: RegistrationProfileInput, userId: string, email: string, provider: string) {
  return {
    auth_user_id: userId,
    email,
    nombre: input.nombre,
    apellido: input.apellido,
    grupo_scout: input.grupo_scout,
    rama: input.rama,
    nombre_scout_relacionado: input.nombre_scout_relacionado,
    tipo_relacion: "scout",
    provider,
    provider_id: userId,
    status: "pending",
    requested_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    admin_notes: null,
    metadata: {},
  };
}

export async function registrationRoutes(app: FastifyInstance): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  api.post(
    "/v1/registration-requests",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: { body: emailRegistrationSchema },
    },
    async (request, reply) => {
      if (!app.supabase) {
        throw new AppError(503, "SUPABASE_NOT_CONFIGURED", "El servicio de registro no está disponible.");
      }
      const admin = requireAdminClient(app);
      const input = request.body;

      const { data: existing, error: lookupError } = await admin
        .from("registration_requests")
        .select("id")
        .eq("email", input.email)
        .maybeSingle();
      if (lookupError) {
        request.log.error({ code: lookupError.code }, "registration lookup failed");
        throw new AppError(503, "REGISTRATION_UNAVAILABLE", "No se pudo procesar la solicitud.");
      }
      if (existing) {
        return reply.status(202).send({ data: publicAccepted });
      }

      const authClient = app.createPublicSupabase();
      const { data: signUp, error: signUpError } = await authClient.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            nombre: input.nombre,
            apellido: input.apellido,
            nombre_completo: `${input.nombre} ${input.apellido}`.trim(),
            grupo_scout: input.grupo_scout,
            rama: input.rama,
            nombre_scout_relacionado: input.nombre_scout_relacionado,
            tipo_relacion: "scout",
          },
        },
      });

      if (signUpError) {
        const status = signUpError.status === 429 ? 429 : 400;
        throw new AppError(
          status,
          status === 429 ? "REGISTRATION_RATE_LIMITED" : "REGISTRATION_REJECTED",
          status === 429
            ? "Se hicieron demasiados intentos. Intenta más tarde."
            : "No se pudo crear la solicitud con esos datos.",
        );
      }
      if (!signUp.user?.id || (Array.isArray(signUp.user.identities) && signUp.user.identities.length === 0)) {
        // Supabase deliberately obscures whether an email already exists.
        return reply.status(202).send({ data: publicAccepted });
      }

      const { error: insertError } = await admin
        .from("registration_requests")
        .insert(registrationRow(input, signUp.user.id, input.email, "email"));
      if (insertError && insertError.code !== "23505") {
        request.log.error({ code: insertError.code, userId: signUp.user.id }, "registration persistence failed");
        throw new AppError(503, "REGISTRATION_PERSISTENCE_FAILED", "La cuenta fue creada, pero la solicitud no pudo guardarse. Contacta a un administrador.");
      }

      return reply.status(202).send({ data: publicAccepted });
    },
  );

  api.post(
    "/v1/registration-requests/oauth",
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: { body: registrationProfileSchema },
    },
    async (request, reply) => {
      const admin = requireAdminClient(app);
      const user = request.authUser;
      if (!user?.email) {
        throw new AppError(400, "AUTH_EMAIL_REQUIRED", "La cuenta OAuth no proporcionó un correo válido.");
      }

      const provider = user.app_metadata?.provider;
      const providerName = typeof provider === "string" ? provider : "oauth";
      const byUser = await admin
        .from("registration_requests")
        .select("id,status")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      const byEmail = byUser.data
        ? { data: null, error: null }
        : await admin
            .from("registration_requests")
            .select("id,status")
            .eq("email", user.email.toLowerCase())
            .maybeSingle();
      if (byUser.error || byEmail.error) {
        throw new AppError(503, "REGISTRATION_UNAVAILABLE", "No se pudo procesar la solicitud.");
      }
      const existing = byUser.data ?? byEmail.data;

      if (existing) {
        if (existing.status === "pending") {
          const { error } = await admin
            .from("registration_requests")
            .update({
              ...registrationRow(request.body, user.id, user.email.toLowerCase(), providerName),
            })
            .eq("id", existing.id)
            .eq("status", "pending");
          if (error) throw new AppError(503, "REGISTRATION_UNAVAILABLE", "No se pudo actualizar la solicitud.");
        }
        return reply.status(202).send({ data: { ...publicAccepted, status: existing.status } });
      }

      const { error } = await admin
        .from("registration_requests")
        .insert(registrationRow(request.body, user.id, user.email.toLowerCase(), providerName));
      if (error && error.code !== "23505") {
        throw new AppError(503, "REGISTRATION_UNAVAILABLE", "No se pudo guardar la solicitud.");
      }
      return reply.status(202).send({ data: { ...publicAccepted, status: "pending" } });
    },
  );

  api.get(
    "/v1/admin/registration-requests",
    {
      preHandler: app.requireAdmin,
      schema: { querystring: registrationListQuerySchema },
    },
    async (request) => {
      const admin = requireAdminClient(app);
      let query = admin
        .from("registration_requests")
        .select("id,auth_user_id,email,nombre,apellido,tipo_relacion,grupo_scout,rama,nombre_scout_relacionado,provider,status,requested_at,reviewed_at,reviewed_by,admin_notes,metadata")
        .eq("status", request.query.status)
        .order("requested_at", { ascending: false })
        .limit(request.query.limit);
      if (request.query.before) query = query.lt("requested_at", request.query.before);
      const { data, error } = await query;
      if (error) throw new AppError(503, "REGISTRATION_LIST_FAILED", "No se pudieron cargar las solicitudes.");
      return { data: data ?? [] };
    },
  );

  api.post(
    "/v1/admin/registration-requests/:id/decision",
    {
      preHandler: app.requireAdmin,
      schema: { params: registrationIdParamsSchema, body: registrationDecisionSchema },
    },
    async (request) => {
      const admin = requireAdminClient(app);
      const { data, error } = await admin.rpc("review_registration_request_v2", {
        p_request_id: request.params.id,
        p_action: request.body.action,
        p_reviewer_id: request.authUser!.id,
        p_admin_notes: request.body.admin_notes,
      });
      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes("email_not_verified")) {
          throw new AppError(409, "EMAIL_NOT_VERIFIED", "El usuario debe confirmar su correo antes de ser aprobado.");
        }
        if (message.includes("registration_not_found")) {
          throw new AppError(404, "REGISTRATION_NOT_FOUND", "La solicitud no existe.");
        }
        if (message.includes("already_reviewed")) {
          throw new AppError(409, "REGISTRATION_ALREADY_REVIEWED", "La solicitud ya fue revisada.");
        }
        request.log.error({ code: error.code }, "registration decision failed");
        throw new AppError(503, "REGISTRATION_DECISION_FAILED", "No se pudo revisar la solicitud.");
      }
      const result = data as { user_id?: string | null; status?: string } | null;
      if (result?.user_id && result.status) {
        const { data: target } = await admin.auth.admin.getUserById(result.user_id);
        if (target.user) {
          const { error: metadataError } = await admin.auth.admin.updateUserById(result.user_id, {
            app_metadata: {
              ...target.user.app_metadata,
              account_status: result.status === "approved" ? "activo" : "rechazado",
            },
            user_metadata: {
              ...target.user.user_metadata,
              ...(result.status === "approved" ? { profile_complete: true } : {}),
            },
          });
          if (metadataError) {
            request.log.error({ userId: result.user_id }, "auth metadata mirror failed");
          }
        }
      }
      return { data };
    },
  );
}
