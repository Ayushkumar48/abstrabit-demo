"use client";

import { useEffect, useState, useRef } from "react";
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

export default function BookmarkList({
  initialBookmarks,
  userId,
}: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>(initialBookmarks);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    console.log("🔌 Setting up realtime for user:", userId);

    // Set up BroadcastChannel for cross-tab communication
    broadcastChannelRef.current = new BroadcastChannel("bookmarks-sync");

    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.type === "DELETE") {
        console.log("📡 Received delete from another tab:", event.data.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== event.data.id));
      }
    };

    // Set up real-time subscription with unique channel name
    const channel = supabase
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
          console.log("✅ Realtime event:", payload.eventType, payload);

          if (payload.eventType === "INSERT") {
            const newBookmark = payload.new as BookmarkType;
            console.log("Adding bookmark:", newBookmark);
            setBookmarks((prev) => {
              // Avoid duplicates
              if (prev.some((b) => b.id === newBookmark.id)) return prev;
              return [newBookmark, ...prev];
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            console.log("❌ Deleting bookmark with id:", deletedId);
            setBookmarks((prev) => {
              const filtered = prev.filter((b) => b.id !== deletedId);
              console.log("Before:", prev.length, "After:", filtered.length);
              return filtered;
            });
          } else if (payload.eventType === "UPDATE") {
            console.log("📝 Updating bookmark");
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === payload.new.id ? (payload.new as BookmarkType) : b,
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime connected!");
          setConnectionStatus("connected");
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.error("❌ Realtime disconnected:", status);
          setConnectionStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      broadcastChannelRef.current?.close();
    };
  }, [userId]);

  const handleDelete = async (id: string) => {
    console.log("🗑️ Attempting to delete bookmark:", id);
    try {
      const { error, data } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .select();

      console.log("Delete response:", { error, data });

      if (error) {
        console.error("❌ Error deleting bookmark:", error);
        alert(`Failed to delete: ${error.message}`);
      } else {
        console.log(
          "✅ Delete successful, updating UI and broadcasting to other tabs",
        );

        // Immediately update local UI
        setBookmarks((prev) => prev.filter((b) => b.id !== id));

        // Broadcast to other tabs
        broadcastChannelRef.current?.postMessage({ type: "DELETE", id });
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  if (bookmarks.length === 0) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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
            <span className="text-destructive">
              Disconnected - refresh to reconnect
            </span>
          </>
        )}
      </div>

      <div className="grid gap-4">
        {bookmarks.map((bookmark) => (
          <Card
            key={bookmark.id}
            className="group hover:shadow-md transition-shadow"
          >
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
                  onClick={() => handleDelete(bookmark.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
