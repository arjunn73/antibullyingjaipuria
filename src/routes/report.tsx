import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle2, Copy, ImagePlus, X } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  class_teacher: z.string().trim().min(1, "Class teacher is required").max(100),
  class_name: z.string().trim().min(1, "Class is required").max(50),
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
  const [form, setForm] = useState({ name: "", class_teacher: "", class_name: "", problem: "", witness: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);

    let photoPath: string | undefined;
    if (photo) {
      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("evidence").upload(path, photo, {
        contentType: photo.type,
        upsert: false,
      });
      if (upErr) { setSubmitting(false); toast.error(`Photo upload failed: ${upErr.message}`); return; }
      photoPath = path;
    }

    const { data, error } = await supabase.rpc("submit_incident", {
      _name: parsed.data.name,
      _class_teacher: parsed.data.class_teacher,
      _class_name: parsed.data.class_name,
      _problem: parsed.data.problem,
      _witness: parsed.data.witness || undefined,
      _witness_photo_path: photoPath,
    });
    setSubmitting(false);
    if (error || !data) { toast.error(error?.message ?? "Failed to submit"); return; }
    setSubmitted({ code: data as string });
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
            Save this tracking code to view the admin's reply later.
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
          <Field id="name" label="Name" required>
            <Input id="name" name="name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
          </Field>
          <Field id="class_teacher" label="Class Teacher" required>
            <Input id="class_teacher" name="class_teacher" value={form.class_teacher} onChange={(e) => setForm({ ...form, class_teacher: e.target.value })} maxLength={100} />
          </Field>
          <Field id="class_name" label="Class" required>
            <Input id="class_name" name="class_name" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} maxLength={50} placeholder="e.g. 10-B" />
          </Field>
          <Field id="problem" label="Reporting Problem" required>
            <Textarea id="problem" name="problem" rows={5} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} maxLength={4000} placeholder="Describe what happened…" />
          </Field>
          <Field id="witness" label="Witness" hint="Optional — anyone who saw what happened.">
            <Input id="witness" name="witness" value={form.witness} onChange={(e) => setForm({ ...form, witness: e.target.value })} maxLength={500} />
          </Field>
          <Field id="witness_photo" label="Witness Photo" hint="Optional — attach a photo as evidence (max 10 MB). Only admins can view it.">
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Witness evidence preview" className="max-h-48 rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted">
                <ImagePlus className="h-5 w-5" />
                <span>Click to upload a photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
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
