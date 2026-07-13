import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare, Clock } from "lucide-react";

type Incident = {
  tracking_code: string; name: string; class_teacher: string; class_name: string;
  problem: string; witness: string | null; reply: string | null;
  replied_at: string | null; created_at: string;
};

export const Route = createFileRoute("/track/$code")({
  component: TrackPage,
  head: ({ params }) => ({
    meta: [
      { title: "Your Report — Anti-Bullying Reporting" },
      { name: "description", content: "Private view of your submitted bullying report and any reply from the school administration team." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Your Report — Anti-Bullying Reporting" },
      { property: "og:description", content: "Private view of your submitted bullying report and any reply from the school administration team." },
      { property: "og:url", content: `https://digitalcampaign.lovable.app/track/${params.code}` },
    ],
    links: [{ rel: "canonical", href: `https://digitalcampaign.lovable.app/track/${params.code}` }],
  }),
});

function TrackPage() {
  const { code } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_incident_by_code", { _code: code });
      if (error) console.error(error);
      setIncident((data as Incident[] | null)?.[0] ?? null);
      setLoading(false);
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        {loading ? (
          <div className="mt-10 text-center text-muted-foreground">Loading…</div>
        ) : !incident ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-semibold">Report not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find a report with code <code className="font-mono">{code}</code>.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Your Report</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Code: <code className="font-mono">{incident.tracking_code}</code> · Submitted {new Date(incident.created_at).toLocaleString()}
            </p>

            <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Row label="Name" value={incident.name} />
              <Row label="Class teacher" value={incident.class_teacher} />
              <Row label="Class" value={incident.class_name} />
              <Row label="Problem" value={incident.problem} multiline />
              {incident.witness && <Row label="Witness" value={incident.witness} />}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Admin Reply</h2>
              </div>
              {incident.reply ? (
                <>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{incident.reply}</p>
                  {incident.replied_at && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Replied {new Date(incident.replied_at).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> Waiting for an admin to reply. Check back soon.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={"mt-1 text-sm " + (multiline ? "whitespace-pre-wrap" : "")}>{value}</div>
    </div>
  );
}
