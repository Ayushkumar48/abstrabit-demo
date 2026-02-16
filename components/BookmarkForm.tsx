"use client";

import { useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Loader, AlertCircle } from "lucide-react";

interface BookmarkFormProps {
  userId: string;
  isRealtimeConnected: boolean;
}

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function BookmarkForm({
  userId,
  isRealtimeConnected,
}: BookmarkFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!isRealtimeConnected) {
        setError("Please wait for real-time connection to be established");
        return;
      }

      setError("");
      setIsSubmitting(true);

      const formData = new FormData(e.currentTarget);
      const title = formData.get("title") as string;
      const url = formData.get("url") as string;

      if (!title?.trim() || !url?.trim()) {
        setError("Title and URL are required");
        setIsSubmitting(false);
        return;
      }

      if (!validateUrl(url)) {
        setError("Please enter a valid URL");
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from("bookmarks").insert({
        user_id: userId,
        title: title.trim(),
        url: url.trim(),
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        formRef.current?.reset();
      }

      setIsSubmitting(false);
    },
    [userId, isRealtimeConnected],
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5" />
          Add New Bookmark
        </CardTitle>
        <CardDescription>
          Save a new URL with a descriptive title
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., React Documentation"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isRealtimeConnected}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader className="size-4 animate-spin" />
                Adding...
              </>
            ) : !isRealtimeConnected ? (
              <>
                <Plus className="size-4" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add Bookmark
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
