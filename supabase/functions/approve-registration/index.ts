// Legacy endpoint intentionally retired. Registration decisions now run through
// the authenticated Fastify command and a service-role-only database function.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() =>
  new Response(
    JSON.stringify({
      error: "ENDPOINT_RETIRED",
      message: "Use POST /v1/admin/registration-requests/:id/decision.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  ),
);
