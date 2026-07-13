import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, FileText, Search, Lock } from "lucide-react";

type Settings = { title: string; description: string; primary_color: string; accent_color: string };

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Anti-Bullying Reporting — Seth M.R. Jaipuria School" },
      { name: "description", content: "A confidential space for students at Seth M.R. Jaipuria School to report bullying. Submissions are private and answered by school administrators." },
      { property: "og:title", content: "Anti-Bullying Reporting — Seth M.R. Jaipuria School" },
      { property: "og:description", content: "A confidential space for students at Seth M.R. Jaipuria School to report bullying. Submissions are private and answered by school administrators." },
      { property: "og:url", content: "https://digitalcampaign.lovable.app/" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1c7dcb21-f134-4140-89be-7c95bdd9a3ab/id-preview-1ee534f7--0e7101ed-f35e-494d-ac7d-146e84ea5303.lovable.app-1782971400784.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1c7dcb21-f134-4140-89be-7c95bdd9a3ab/id-preview-1ee534f7--0e7101ed-f35e-494d-ac7d-146e84ea5303.lovable.app-1782971400784.png" },
    ],
    links: [{ rel: "canonical", href: "https://digitalcampaign.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Seth M.R. Jaipuria School — Anti-Bullying Reporting",
          url: "https://digitalcampaign.lovable.app/",
          description: "Confidential bullying incident reporting for Seth M.R. Jaipuria School, run by the Digital Campaign Club.",
          publisher: {
            "@type": "EducationalOrganization",
            name: "Seth M.R. Jaipuria School",
          },
        }),
      },
    ],
  }),
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
              <h2 className="text-lg font-semibold" style={{ color: accent }}>Check for updates</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your code below to view replies from the school team.
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
                  id="tracking-code"
                  name="tracking-code"
                  aria-label="Report tracking code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="E.G. A1B2C3D4E5"
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
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { title: "Confidential Reporting", body: "We maintain confidentiality. Only the school team can see your report." },
            { title: "Tracked reply", body: "Come back anytime with your code to view updates." },
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
          Through awareness, conscious efforts, and compassion, we’re building a kinder school community for everyone.
        </p>
      </footer>
    </div>
  );
}
