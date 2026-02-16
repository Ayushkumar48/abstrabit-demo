"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { user, supabase };
}

export async function getBookmarks() {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return { success: false, error: "Failed to fetch bookmarks" };
  }
}

export async function addBookmark(formData: FormData) {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    const title = formData.get("title") as string;
    const url = formData.get("url") as string;

    if (!title?.trim() || !url?.trim()) {
      return { success: false, error: "Title and URL are required" };
    }

    try {
      new URL(url);
    } catch {
      return { success: false, error: "Please enter a valid URL" };
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      title: title.trim(),
      url: url.trim(),
    });

    if (error) throw error;

    // Don't await revalidation - let it happen in background for faster response
    revalidatePath("/dashboard");

    return { success: true, message: "Bookmark added successfully" };
  } catch (error) {
    console.error("Error adding bookmark:", error);
    return { success: false, error: "Failed to add bookmark" };
  }
}

export async function deleteBookmark(bookmarkId: string) {
  try {
    const { supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) throw error;

    // Don't await revalidation - let it happen in background for faster response
    revalidatePath("/dashboard");

    return { success: true, message: "Bookmark deleted successfully" };
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return { success: false, error: "Failed to delete bookmark" };
  }
}
