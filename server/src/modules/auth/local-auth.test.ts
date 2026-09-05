import { describe, expect, it } from "vitest";

import { hashSessionToken, localUserFromRow } from "./local-auth.js";

describe("local auth primitives", () => {
  it("hashes session tokens deterministically without exposing the token", () => {
    const token = "secret-access-token";
    const hash = hashSessionToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
  });

  it("maps database users to the auth shape used by the existing server", () => {
    const user = localUserFromRow({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "member@example.com",
      email_verified_at: null,
      account_status: "activo",
      app_metadata: { role: "admin" },
      user_metadata: { nombre: "Ada" },
      password_reset_required: false,
    });

    expect(user).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "member@example.com",
      app_metadata: { role: "admin" },
    });
  });
});
