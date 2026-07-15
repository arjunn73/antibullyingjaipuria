import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  reply: string | null;
  replied_at: string | null;
};

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    refresh();
  }, []);

  const pendingReports = reports.filter((report) => !report.reply?.trim());
  const repliedReports = reports.filter((report) => Boolean(report.reply?.trim()));

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

  async function submitReply(id: string) {
    const reply = (replyDrafts[id] ?? "").trim();
    if (!reply) {
      toast.error("Please enter a reply before saving.");
      return;
    }

    const { data, error } = await reportsDb
      .from("reports")
      .update({ reply, replied_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return toast.error(error.message);

    setReports((current) =>
      current.map((report) => (report.id === id ? { ...report, reply: data.reply, replied_at: data.replied_at } : report)),
    );
    setReplyingId(null);
    setReplyDrafts((current) => ({ ...current, [id]: "" }));
    toast.success("Reply saved");
  }

  function startReply(report: Report) {
    setReplyingId(report.id);
    setReplyDrafts((current) => ({ ...current, [report.id]: report.reply ?? "" }));
  }

  function cancelReply(id: string) {
    setReplyingId((current) => (current === id ? null : current));
    setReplyDrafts((current) => ({ ...current, [id]: "" }));
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
            <Button variant="ghost" size="sm" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No reports yet.
          </div>
        ) : (
          <>
            <Section
              title="Pending"
              count={pendingReports.length}
              emptyMessage="No pending reports."
              reports={pendingReports}
              replyingId={replyingId}
              replyDrafts={replyDrafts}
              onStartReply={startReply}
              onCancelReply={cancelReply}
              onSubmitReply={submitReply}
              onReplyDraftChange={(id, value) => setReplyDrafts((current) => ({ ...current, [id]: value }))}
            />
            <Section
              title="Replied"
              count={repliedReports.length}
              emptyMessage="No replied reports yet."
              reports={repliedReports}
              replyingId={replyingId}
              replyDrafts={replyDrafts}
              onStartReply={startReply}
              onCancelReply={cancelReply}
              onSubmitReply={submitReply}
              onReplyDraftChange={(id, value) => setReplyDrafts((current) => ({ ...current, [id]: value }))}
            />
          </>
        )}
      </main>
    </div>
  );
}

type SectionProps = {
  title: string;
  count: number;
  emptyMessage: string;
  reports: Report[];
  replyingId?: string | null;
  replyDrafts?: Record<string, string>;
  onStartReply?: (report: Report) => void;
  onCancelReply?: (id: string) => void;
  onSubmitReply?: (id: string) => void;
  onReplyDraftChange?: (id: string, value: string) => void;
};

function Section({
  title,
  count,
  emptyMessage,
  reports,
  replyingId,
  replyDrafts = {},
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onReplyDraftChange,
}: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        <Badge variant="secondary">{count}</Badge>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isReplied = Boolean(report.reply?.trim());
            const isReplying = replyingId === report.id;
            return (
              <div key={report.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{report.student_name}</h3>
                      <Badge variant={isReplied ? "default" : "secondary"}>{isReplied ? "Replied" : "Pending"}</Badge>
                      <Badge variant="outline">Class {report.class}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Teacher: {report.class_teacher} · Code <code className="font-mono">{report.track_id}</code>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeReport(report.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-2 rounded-lg bg-muted p-4 text-sm">
                  <div>
                    <span className="font-medium">Problem:</span>{" "}
                    <span className="whitespace-pre-wrap">{report.problem}</span>
                  </div>
                  {report.witness && (
                    <div>
                      <span className="font-medium">Witness:</span> {report.witness}
                    </div>
                  )}
                </div>

                {isReplied ? (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">School reply</span>
                      {report.replied_at ? (
                        <span className="text-xs text-muted-foreground">{new Date(report.replied_at).toLocaleString()}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">{report.reply}</p>
                  </div>
                ) : isReplying ? (
                  <div className="mt-4 space-y-3 rounded-lg border border-border bg-background p-4">
                    <Textarea
                      placeholder="Write a response for the student..."
                      value={replyDrafts[report.id] ?? ""}
                      onChange={(event) => onReplyDraftChange?.(report.id, event.target.value)}
                      rows={6}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onCancelReply?.(report.id)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => onSubmitReply?.(report.id)}>
                        Save reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => onStartReply?.(report)}>Reply to Report</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

async function removeReport(id: string) {
  if (!confirm("Delete this report permanently?")) return;
  const { error } = await reportsDb.from("reports").delete().eq("id", id);
  if (error) return toast.error(error.message);
  toast.success("Deleted");
  window.location.reload();
}
