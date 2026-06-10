import { OAuth2Client } from "google-auth-library";
import { getDb, upsertUser } from "./db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";

export const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export async function getGoogleAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: Math.random().toString(36).substring(7),
  });

  return url;
}

export async function handleGoogleCallback(code: string) {
  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token || "",
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("No payload from Google");

    const user = {
      openId: payload.sub || "",
      email: payload.email || "",
      name: payload.name || "",
      loginMethod: "google",
      lastSignedIn: new Date(),
    };

    await upsertUser(user);

    return {
      success: true,
      user: {
        openId: user.openId,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Google auth error:", error);
    throw error;
  }
}
