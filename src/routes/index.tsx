import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, FileText, Search, Lock } from "lucide-react";

type Settings = { title: string; description: string; primary_color: string; accent_color: string };

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
      .then(({ data }) => data && setSettings(data as Settings));
  }, []);

  const primary = settings?.primary_color ?? "#2563eb";
  const accent = settings?.accent_color ?? "#0f172a";

  return (
    <div className="min-h-screen bg-background" style={{ ["--brand" as never]: primary, ["--brand-accent" as never]: accent }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
        >
          <Lock className="h-3.5 w-3.5" />
          Admin Login
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-4 w-4" style={{ color: primary }} />
          Confidential
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10 md:pt-20">
        <div className="text-center">
          <div className="mb-6 inline-flex rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${primary}15`, color: primary }}>
            Safe. Private. Heard.
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl" style={{ color: accent }}>
            {settings?.title ?? "Incident Reporting"}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {settings?.description ?? "A safe space to report incidents. Submissions are private and only visible to administrators."}
          </p>

          <div className="mt-10">
            <Button asChild size="lg" className="h-14 rounded-full px-8 text-base font-semibold shadow-lg transition hover:scale-[1.02]" style={{ backgroundColor: primary, color: "white" }}>
              <Link to="/report">
                <FileText className="mr-2 h-5 w-5" />
                Report an Incident
              </Link>
            </Button>
          </div>
        </div>

        {/* Reply lookup */}
        <section className="mt-20 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2" style={{ backgroundColor: `${primary}15` }}>
              <Search className="h-5 w-5" style={{ color: primary }} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold" style={{ color: accent }}>Check for an Admin Reply</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the tracking code you received after submitting your report.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const c = code.trim().toUpperCase();
                  if (c) window.location.href = `/track/${c}`;
                }}
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4E5"
                  className="font-mono uppercase tracking-wider"
                  maxLength={20}
                />
                <Button type="submit" style={{ backgroundColor: accent, color: "white" }}>
                  View reply
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Private", body: "Only administrators see your report." },
            { title: "Anonymous option", body: "You choose what to include." },
            { title: "Tracked reply", body: "Come back anytime with your code." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card/50 p-5">
              <div className="text-sm font-semibold" style={{ color: accent }}>{c.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground px-6">
        <p className="max-w-xl mx-auto">
          A safe place to report your problems to school. We hope the future includes less bullying cases and better environment for our community
        </p>
      </footer>
    </div>
  );
}
