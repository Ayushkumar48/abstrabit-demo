import { supabase } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark, Zap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="size-4" />
              <span>Smart Bookmark Management</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
              Your Bookmarks,
              <br />
              <span className="text-primary">Organized & Synced</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Save, organize, and access your favorite links from anywhere.
              Real-time sync across all your devices with enterprise-grade
              security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-base px-8 h-12">
                  Get Started Free
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8 h-12"
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to help you manage your bookmarks efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-2xl p-6 shadow-sm ring-1 ring-border hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Bookmark className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">
                Quick Save
              </h3>
              <p className="text-muted-foreground text-sm">
                Save any URL with a title in seconds. Simple and intuitive
                interface.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-2xl p-6 shadow-sm ring-1 ring-border hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="size-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">
                Real-time Sync
              </h3>
              <p className="text-muted-foreground text-sm">
                Changes appear instantly across all your open tabs and devices.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-2xl p-6 shadow-sm ring-1 ring-border hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <Shield className="size-6 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">
                Private & Secure
              </h3>
              <p className="text-muted-foreground text-sm">
                Your bookmarks are private. Only you can see and access them.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card rounded-2xl p-6 shadow-sm ring-1 ring-border hover:shadow-md transition-shadow">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">
                Google Sign In
              </h3>
              <p className="text-muted-foreground text-sm">
                Secure authentication with your Google account. No passwords to
                remember.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-12 text-center shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already organizing their bookmarks
              smarter. Sign up now and experience the difference.
            </p>
            <Link href="/dashboard">
              <Button
                variant="secondary"
                size="lg"
                className="text-base px-8 h-12 shadow-lg hover:shadow-xl transition-shadow"
              >
                Start Bookmarking Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Smart Bookmark App. Built with
              Next.js, Supabase, and Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
