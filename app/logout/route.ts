import {
  getCurrentSession,
  invalidateSession,
  deleteSessionTokenCookie,
} from "@/lib/auth";

export async function GET(request: Request): Promise<Response> {
  const { session } = await getCurrentSession();

  if (session) {
    await invalidateSession(session.id);
  }

  await deleteSessionTokenCookie();

  return Response.redirect(new URL("/login", request.url));
}

export async function POST(request: Request): Promise<Response> {
  const { session } = await getCurrentSession();

  if (session) {
    await invalidateSession(session.id);
  }

  await deleteSessionTokenCookie();

  return Response.redirect(new URL("/login", request.url));
}
