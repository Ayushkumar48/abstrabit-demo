# Smart Bookmark App

A bookmark manager I built with Next.js and Supabase. It syncs bookmarks in real-time across tabs and devices using Supabase's realtime feature.

## What it does

- Google sign-in for auth
- Save and delete bookmarks
- Real-time sync — changes show up instantly in all open tabs
- Clean UI with Tailwind and shadcn/ui

## Stack

- Next.js 16 + React 19 + TypeScript
- Supabase for database, auth, and realtime
- Tailwind CSS + shadcn/ui

## Setup

You'll need Node.js 20+ and a Supabase project.

1. Clone and install deps:
```bash
git clone <repo-url>
cd abstrabit-demo
bun install
```

2. Create a `.env.local` file with your Supabase creds:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

3. Run the RLS policies on your Supabase database:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase-rls-policies.sql
```

4. Start it up:
```bash
bun dev
```

## Database

Just one table:

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Realtime issue I ran into

This one took me a while to figure out. When I navigated from the homepage to `/dashboard` using Next.js client-side routing, the realtime connection would fail and show "Disconnected." But if I refreshed the page, it worked fine.

Turns out the Supabase browser client initializes auth from cookies asynchronously. My code was trying to subscribe to a realtime channel before auth was actually ready, so the subscription would just fail silently with `CHANNEL_ERROR` or `TIMED_OUT`.

The fix was straightforward — I just added `await supabase.auth.getSession()` before setting up the realtime subscription. That gives the client time to load the auth state from cookies before attempting to connect.

On top of that, I lifted the connection status into a shared parent component so the bookmark form stays disabled until realtime is actually connected. That way you can't submit a bookmark while the connection is still being established.

## Deploy

```bash
bun run build
bun run start
```
