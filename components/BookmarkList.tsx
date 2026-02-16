"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, ExternalLink, Trash2, Wifi, WifiOff } from "lucide-react";

interface BookmarkType {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string | null;
}

interface BookmarkListProps {
  initialBookmarks: BookmarkType[];
  userId: string;
  onConnectionStatusChange: (
    status: "connecting" | "connected" | "disconnected",
  ) => void;
}

const formatDate = (date: string | null) => {
  if (!date) return "Recently";
  const dateObj = new Date(date);
  const daysDiff = Math.ceil(
    (dateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff === 0) return "Today";
  if (daysDiff === -1) return "Yesterday";
  if (daysDiff > -7 && daysDiff < 0) return `${Math.abs(daysDiff)} days ago`;

  return dateObj.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year:
      dateObj.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
};

const pluralizeBookmarks = (count: number) => {
  return `${count} bookmark${count !== 1 ? "s" : ""}`;
};

interface BookmarkCardProps {
  bookmark: BookmarkType;
  onDelete: (id: string) => void;
}

const BookmarkCard = ({ bookmark, onDelete }: BookmarkCardProps) => {
  return (
    <Card key={bookmark.id} className="group hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bookmark className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1 truncate">
                  {bookmark.title}
                </h3>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{bookmark.url}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  Added {formatDate(bookmark.created_at)}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(bookmark.id)}
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function BookmarkList({
  initialBookmarks,
  userId,
  onConnectionStatusChange,
}: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>(initialBookmarks);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const router = useRouter();

  const bookmarkCountText = useMemo(
    () => pluralizeBookmarks(bookmarks.length),
    [bookmarks.length],
  );

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    onConnectionStatusChange("connecting");

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    broadcastChannelRef.current = new BroadcastChannel("bookmarks-sync");

    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.type === "DELETE") {
        setBookmarks((prev) => prev.filter((b) => b.id !== event.data.id));
      }
    };
    async function setupRealtime() {
      await supabase.auth.getSession();

      if (cancelled) return;

      channel = supabase
        .channel(`bookmarks-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newBookmark = payload.new as BookmarkType;
              setBookmarks((prev) => {
                if (prev.some((b) => b.id === newBookmark.id)) return prev;
                return [newBookmark, ...prev];
              });
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id;
              setBookmarks((prev) => {
                const filtered = prev.filter((b) => b.id !== deletedId);
                return filtered;
              });
            } else if (payload.eventType === "UPDATE") {
              setBookmarks((prev) =>
                prev.map((b) =>
                  b.id === payload.new.id ? (payload.new as BookmarkType) : b,
                ),
              );
            }
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            onConnectionStatusChange("connected");
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setConnectionStatus("disconnected");
            onConnectionStatusChange("disconnected");
          }
        });
    }

    setupRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      broadcastChannelRef.current?.close();
    };
  }, [userId, onConnectionStatusChange]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        alert(`Failed to delete: ${error.message}`);
      } else {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));

        broadcastChannelRef.current?.postMessage({ type: "DELETE", id });
      }
    } catch {}
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Your Bookmarks
        </h2>
        <span className="text-sm text-muted-foreground">
          {bookmarkCountText}
        </span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-end gap-2 text-xs mb-2">
        {connectionStatus === "connected" ? (
          <>
            <Wifi className="size-3 text-green-500" />
            <span className="text-muted-foreground">Real-time connected</span>
          </>
        ) : connectionStatus === "connecting" ? (
          <>
            <Wifi className="size-3 text-yellow-500 animate-pulse" />
            <span className="text-muted-foreground">Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="size-3 text-destructive" />
            <span className="text-destructive">Disconnected</span>
          </>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Bookmark className="size-12 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No bookmarks yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Start by adding your first bookmark above
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
