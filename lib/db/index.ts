import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { Google } from "arctic";

const url = process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL missing in Node environment");

const client = postgres(url);

export const db = drizzle(client, { schema });
export const isDev = process.env.NODE_ENV === "development";

export const googleAuth = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  isDev
    ? "http://localhost:3000/login/google/callback"
    : "https://zeronoticed.vercel.app/login/google/callback",
);
