import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { reportsDb, generateTrackId } from "@/lib/reports-client";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle2, Copy } from "lucide-react";

const schema = z.object({
  student_name: z.string().trim().min(1, "Name is required").max(100),
  class_teacher: z.string().trim().min(1, "Class teacher is required").max(100),
  class: z.string().trim().min(1, "Class is required").max(50),
  problem: z.string().trim().min(5, "Please describe the problem").max(4000),
  witness: z.string().trim().max(500).optional(),
});

export const Route = createFileRoute("/report")({
  component: ReportPage,
  head: () => ({
    meta: [
      { title: "Report an Incident — Anti-Bullying Reporting" },
      { name: "description", content: "Submit a confidential bullying incident report to Seth M.R. Jaipuria School. Only administrators can see your submission; you'll get a code to track replies." },
      { property: "og:title", content: "Report an Incident — Anti-Bullying Reporting" },
      { property: "og:description", content: "Submit a confidential bullying incident report to Seth M.R. Jaipuria School. Only administrators can see your submission; you'll get a code to track replies." },
      { property: "og:url", content: "https://digitalcampaign.lovable.app/report" },
    ],
    links: [{ rel: "canonical", href: "https://digitalcampaign.lovable.app/report" }],
  }),
});

function ReportPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ code: string } | null>(null);
  const [form, setForm] = useState({ student_name: "", class_teacher: "", class: "", problem: "", witness: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);

    const track_id = generateTrackId();
    const { error } = await reportsDb.from("reports").insert({
      student_name: parsed.data.student_name,
      class_teacher: parsed.data.class_teacher,
      class: parsed.data.class,
      problem: parsed.data.problem,
      witness: parsed.data.witness || null,
      track_id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted({ code: track_id });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Report submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save this tracking code to view your report later.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-muted p-4">
            <code className="font-mono text-lg font-bold tracking-wider">{submitted.code}</code>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(submitted.code); toast.success("Copied"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>Back home</Button>
            <Button onClick={() => navigate({ to: "/track/$code", params: { code: submitted.code } })}>View my report</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Report an Incident</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only administrators can see what you submit.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <Field id="student_name" label="Name" required>
            <Input id="student_name" name="student_name" autoComplete="name" value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} maxLength={100} />
          </Field>
          <Field id="class_teacher" label="Class Teacher" required>
            <Input id="class_teacher" name="class_teacher" value={form.class_teacher} onChange={(e) => setForm({ ...form, class_teacher: e.target.value })} maxLength={100} />
          </Field>
          <Field id="class" label="Class" required>
            <Input id="class" name="class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} maxLength={50} placeholder="e.g. 10-B" />
          </Field>
          <Field id="problem" label="Reporting Problem" required>
            <Textarea id="problem" name="problem" rows={5} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} maxLength={4000} placeholder="Describe what happened…" />
          </Field>
          <Field id="witness" label="Witness" hint="Optional — anyone who saw what happened.">
            <Input id="witness" name="witness" value={form.witness} onChange={(e) => setForm({ ...form, witness: e.target.value })} maxLength={500} />
          </Field>
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Sending…" : "Send Report"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, required, hint, children }: { id?: string; label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
