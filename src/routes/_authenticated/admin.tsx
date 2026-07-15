import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reportsDb } from "@/lib/reports-client";
import { toast } from "sonner";
import { LogOut, Trash2, RefreshCw } from "lucide-react";

type Report = {
  id: string;
  track_id: string;
  student_name: string;
  class_teacher: string;
  class: string;
  problem: string;
  witness: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    const { data, error } = await reportsDb
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setReports((data ?? []) as Report[]);
    setLoading(false);
  }

  async function signOut() {
    await reportsDb.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this report permanently?")) return;
    const { error } = await reportsDb.from("reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">{reports.length} reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No reports yet.
          </div>
        ) : reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{r.student_name}</h3>
                  <Badge variant="secondary">Class {r.class}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Teacher: {r.class_teacher} · Code <code className="font-mono">{r.track_id}</code>
                </p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2 rounded-lg bg-muted p-4 text-sm">
              <div><span className="font-medium">Problem:</span> <span className="whitespace-pre-wrap">{r.problem}</span></div>
              {r.witness && <div><span className="font-medium">Witness:</span> {r.witness}</div>}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
