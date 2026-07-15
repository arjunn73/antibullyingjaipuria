import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { reportsDb } from "@/lib/reports-client";
import { ArrowLeft } from "lucide-react";

type Report = {
  track_id: string;
  student_name: string;
  class_teacher: string;
  class: string;
  problem: string;
  witness: string | null;
  created_at: string;
};

export const Route = createFileRoute("/track/$code")({
  component: TrackPage,
  head: ({ params }) => ({
    meta: [
      { title: "Your Report — Anti-Bullying Reporting" },
      { name: "description", content: "Private view of your submitted bullying report." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Your Report — Anti-Bullying Reporting" },
      { property: "og:description", content: "Private view of your submitted bullying report." },
      { property: "og:url", content: `https://digitalcampaign.lovable.app/track/${params.code}` },
    ],
    links: [{ rel: "canonical", href: `https://digitalcampaign.lovable.app/track/${params.code}` }],
  }),
});

function TrackPage() {
  const { code } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await reportsDb
        .from("reports")
        .select("track_id, student_name, class_teacher, class, problem, witness, created_at")
        .eq("track_id", code)
        .maybeSingle();
      if (error) console.error(error);
      setReport((data as Report | null) ?? null);
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
        ) : !report ? (
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
              Code: <code className="font-mono">{report.track_id}</code> · Submitted {new Date(report.created_at).toLocaleString()}
            </p>

            <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Row label="Name" value={report.student_name} />
              <Row label="Class teacher" value={report.class_teacher} />
              <Row label="Class" value={report.class} />
              <Row label="Problem" value={report.problem} multiline />
              {report.witness && <Row label="Witness" value={report.witness} />}
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
