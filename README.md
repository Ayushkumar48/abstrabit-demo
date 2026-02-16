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

## Setting up Supabase Realtime — what I learned

Supabase realtime was completely new to me going into this project. The docs make it look simple — just call `.channel()` and `.subscribe()` — but getting it to work properly with Next.js had a few gotchas that took me a while to work through.

First, you need to enable realtime on your table in the Supabase dashboard (Database → Replication). I missed this initially and spent a while wondering why nothing was happening.

Then there's the RLS side of things. Your realtime subscriptions respect row-level security, so you need proper policies in place or you just get empty payloads. The `supabase-rls-policies.sql` file in this repo has the policies I ended up with.

The trickiest bug was with client-side navigation. Going from the homepage to `/dashboard` would show "Disconnected", but a page refresh would connect just fine. After a lot of debugging, I figured out that the Supabase browser client loads auth state from cookies asynchronously. My subscription was firing before auth was ready, so it would just fail with `CHANNEL_ERROR` or `TIMED_OUT`. The fix was adding `await supabase.auth.getSession()` before subscribing — that waits for auth to be loaded first.

I also had to think about cross-tab behavior. If you log out in one tab, the other tab with the dashboard should kick you out too. I added an `onAuthStateChange` listener for that. And for the bookmark form, I lifted the connection status up so the form stays disabled until realtime is actually connected — no point letting someone submit if the sync isn't ready.

Overall it wasn't too bad once I understood the pieces, but the auth + realtime interaction in a Next.js app with SSR and client-side navigation definitely has some sharp edges that aren't obvious from the docs alone.

## Deploy

```bash
bun run build
bun run start
```
