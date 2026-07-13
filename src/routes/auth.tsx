import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock } from "lucide-react";

const EMAIL_DOMAIN = "@jaipuria.local";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Admin Sign In — Anti-Bullying Reporting" },
      { name: "description", content: "Administrator sign-in for the Seth M.R. Jaipuria School anti-bullying reporting panel." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Sign In — Anti-Bullying Reporting" },
      { property: "og:description", content: "Administrator sign-in for the Seth M.R. Jaipuria School anti-bullying reporting panel." },
      { property: "og:url", content: "https://digitalcampaign.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://digitalcampaign.lovable.app/auth" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Make sure the fixed admin exists (idempotent)
      await fetch("/api/public/setup-admin", { method: "POST" }).catch(() => {});

      const email = username.trim().toLowerCase() + EMAIL_DOMAIN;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold">Admin Panel</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Seth M.R. Jaipuria School · Digital Campaign Club
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="digital.campaign"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
