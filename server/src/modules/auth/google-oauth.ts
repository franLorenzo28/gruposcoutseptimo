import { OAuth2Client } from "google-auth-library";
import type { EnvironmentConfig } from "../../config/environment.js";

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

export interface GoogleOAuthClient {
  authorizationUrl(state: string, nonce: string): string;
  exchangeAndVerify(code: string, nonce: string): Promise<VerifiedGoogleIdentity>;
}

export function createGoogleOAuthClient(config: EnvironmentConfig): GoogleOAuthClient | null {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_REDIRECT_URI) return null;
  const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI);
  return {
    authorizationUrl: (state, nonce) => client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      prompt: "select_account",
    }),
    exchangeAndVerify: async (code, nonce) => {
      const { tokens } = await client.getToken(code);
      if (!tokens.id_token) throw new Error("Google did not return an ID token");
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: config.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.nonce !== nonce) throw new Error("Google identity claims are invalid");
      return {
        subject: payload.sub,
        email: payload.email.toLowerCase(),
        emailVerified: payload.email_verified === true,
        name: payload.name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
      };
    },
  };
}
