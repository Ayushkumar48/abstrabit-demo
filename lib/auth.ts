import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "./db";
import * as schema from "./db/schema";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const SESSION_COOKIE_NAME = "auth-session";

// Generate a random session token
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}

// Create a new session
export async function createSession(
  token: string,
  userId: string
): Promise<schema.Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: schema.Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
  };
  await db.insert(schema.session).values(session);
  return session;
}

// Validate session token and return user + session
export async function validateSessionToken(token: string): Promise<{
  session: schema.Session | null;
  user: schema.User | null;
}> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const [result] = await db
    .select({
      user: schema.users,
      session: schema.session,
    })
    .from(schema.session)
    .innerJoin(schema.users, eq(schema.session.userId, schema.users.id))
    .where(eq(schema.session.id, sessionId));

  if (!result) {
    return { session: null, user: null };
  }

  const { session, user } = result;

  // Check if session expired
  const sessionExpired = Date.now() >= session.expiresAt.getTime();
  if (sessionExpired) {
    await db.delete(schema.session).where(eq(schema.session.id, session.id));
    return { session: null, user: null };
  }

  // Renew session if it's close to expiring (within 15 days)
  const renewSession =
    Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
  if (renewSession) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(schema.session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(schema.session.id, session.id));
  }

  return { session, user };
}

// Invalidate a session
export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(schema.session).where(eq(schema.session.id, sessionId));
}

// Set session cookie
export async function setSessionTokenCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

// Delete session cookie
export async function deleteSessionTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

// Get current session (cached for the request lifecycle)
export const getCurrentSession = cache(
  async (): Promise<{
    session: schema.Session | null;
    user: schema.User | null;
  }> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;

    if (!token) {
      return { session: null, user: null };
    }

    const result = await validateSessionToken(token);
    return result;
  }
);

// Generate a unique user ID
export function generateUserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  const id = encodeBase64url(bytes);
  return id;
}

// Get user by Google ID
export async function getUserByGoogleId(
  googleId: string
): Promise<schema.User | null> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.googleId, googleId));

  return user ?? null;
}

// Create a new user
export async function createUser(userData: {
  googleId: string;
  name: string;
  email: string;
  image?: string;
}): Promise<schema.User> {
  const userId = generateUserId();

  const [user] = await db
    .insert(schema.users)
    .values({
      id: userId,
      googleId: userData.googleId,
      name: userData.name,
      email: userData.email,
      image: userData.image ?? null,
    })
    .returning();

  return user;
}
