"use client";

import { useState, useCallback } from "react";
import BookmarkForm from "./BookmarkForm";
import BookmarkList from "./BookmarkList";

interface BookmarkType {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string | null;
}

interface DashboardClientProps {
  userId: string;
  initialBookmarks: BookmarkType[];
}

export default function DashboardClient({
  userId,
  initialBookmarks,
}: DashboardClientProps) {
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  const handleConnectionStatusChange = useCallback(
    (status: "connecting" | "connected" | "disconnected") => {
      setConnectionStatus(status);
    },
    [],
  );

  return (
    <>
      <BookmarkForm
        userId={userId}
        isRealtimeConnected={connectionStatus === "connected"}
      />
      <BookmarkList
        initialBookmarks={initialBookmarks}
        userId={userId}
        onConnectionStatusChange={handleConnectionStatusChange}
      />
    </>
  );
}
