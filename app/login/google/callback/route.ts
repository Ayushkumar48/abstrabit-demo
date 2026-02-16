import { decodeIdToken } from "arctic";
import type { OAuth2Tokens } from "arctic";
import { googleAuth } from "@/lib/db";
import { cookies } from "next/headers";
import {
  createSession,
  createUser,
  generateSessionToken,
  getUserByGoogleId,
  setSessionTokenCookie,
} from "@/lib/auth";

type GoogleUser = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
};

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

  // Validate required parameters
  if (!code || !state || !storedState || !codeVerifier) {
    return new Response("Invalid request", { status: 400 });
  }

  // Validate state to prevent CSRF
  if (state !== storedState) {
    return new Response("Invalid state", { status: 400 });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await googleAuth.validateAuthorizationCode(code, codeVerifier);
  } catch (e) {
    console.error("Failed to validate authorization code:", e);
    return new Response("Failed to validate authorization code", {
      status: 400,
    });
  }

  const claims = decodeIdToken(tokens.idToken()) as GoogleUser;
  const googleUserId = claims.sub;

  // Check if user already exists
  const existingUser = await getUserByGoogleId(googleUserId);

  if (existingUser) {
    // User exists, create session and redirect
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, existingUser.id);
    await setSessionTokenCookie(sessionToken, session.expiresAt);

    return Response.redirect(new URL("/dashboard", request.url));
  }

  // Create new user
  const user = await createUser({
    googleId: googleUserId,
    email: claims.email || "",
    name: claims.name || claims.email?.split("@")[0] || "User",
    image: claims.picture,
  });

  // Create session for new user
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return Response.redirect(new URL("/dashboard", request.url));
}
