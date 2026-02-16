"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import LoginButton from "./login-button";
import { Button } from "./ui/button";
import { Bookmark, LogOut, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bookmark className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Smart Bookmark
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="size-8 rounded-full ring-2 ring-border"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="size-4 text-primary" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-foreground">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </span>
                </button>
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg ring-1 ring-border py-2 z-20">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
