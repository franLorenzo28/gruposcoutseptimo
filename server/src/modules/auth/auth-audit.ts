import type { FastifyInstance, FastifyRequest } from "fastify";
import { hashSessionToken } from "./local-auth.js";
import { LocalAuthRepository } from "./local-auth.repository.js";

export interface AuthAuditInput {
  eventType: string;
  success: boolean;
  subjectUserId?: string | null;
  email?: string | null;
  details?: Record<string, unknown>;
}

export async function recordAuthAudit(
  app: FastifyInstance,
  request: FastifyRequest,
  input: AuthAuditInput,
): Promise<void> {
  try {
    await new LocalAuthRepository(app).recordAudit({
      event_type: input.eventType,
      success: input.success,
      subject_user_id: input.subjectUserId,
      identifier_hash: input.email ? hashSessionToken(input.email.trim().toLowerCase()) : null,
      request_id: request.id,
      ip_address: request.ip,
      user_agent: request.headers["user-agent"],
      details: input.details,
    });
  } catch {
    request.log.warn({ eventType: input.eventType }, "authentication audit persistence failed");
  }
}
