import type { FastifyError, FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

import { AppError } from "../core/errors.js";

function publicMessage(statusCode: number, error: Error): string {
  if (statusCode >= 500 && !(error instanceof AppError)) {
    return "Ocurrió un error interno.";
  }
  return error.message;
}

export function installErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "La ruta solicitada no existe.",
        requestId: request.id,
      },
    }),
  );

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const isValidationError = hasZodFastifySchemaValidationErrors(error);
    const statusCode = isValidationError
      ? 400
      : error instanceof AppError
        ? error.statusCode
        : typeof error.statusCode === "number" && error.statusCode >= 400
          ? error.statusCode
          : 500;
    const code = isValidationError
      ? "VALIDATION_ERROR"
      : error instanceof AppError
        ? error.code
        : statusCode >= 500
          ? "INTERNAL_ERROR"
          : error.code || "REQUEST_ERROR";
    const details = isValidationError
      ? error.validation?.map((issue) => ({
          path: issue.instancePath,
          message: issue.message,
        }))
      : error instanceof AppError
        ? error.details
        : undefined;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "request failed");
    } else {
      request.log.info({ err: error }, "request rejected");
    }

    return reply.status(statusCode).send({
      error: {
        code,
        message: isValidationError
          ? "La solicitud no cumple el contrato esperado."
          : publicMessage(statusCode, error),
        requestId: request.id,
        ...(details === undefined ? {} : { details }),
      },
    });
  });
}
