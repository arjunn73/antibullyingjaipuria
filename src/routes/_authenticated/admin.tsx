import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Reply, Ban, CheckCircle2, MessageSquare, Palette, Trash2 } from "lucide-react";

type Incident = {
  id: string; tracking_code: string; name: string; class_teacher: string; class_name: string;
  problem: string; witness: string | null; reply: string | null;
  replied_at: string | null; is_blocked: boolean; created_at: string;
};
type Settings = { id: number; title: string; description: string; primary_color: string; accent_color: string };

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!roles);
      if (roles) await refresh();
      setLoading(false);
    })();
  }, []);

  async function refresh() {
    const [{ data: inc }, { data: st }] = await Promise.all([
      supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setIncidents((inc ?? []) as Incident[]);
    setSettings(st as Settings | null);
  }

  async function claimAdmin() {
    const { data, error } = await supabase.rpc("claim_admin");
    if (error) return toast.error(error.message);
    if (data) { toast.success("You are now admin"); setIsAdmin(true); await refresh(); }
    else toast.error("An admin already exists");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function sendReply(id: string) {
    const reply = replyDraft[id]?.trim();
    if (!reply) return toast.error("Reply cannot be empty");
    const { error } = await supabase.from("incidents").update({ reply, replied_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reply sent");
    setReplyDraft((d) => ({ ...d, [id]: "" }));
    await refresh();
  }

  async function toggleBlock(id: string, is_blocked: boolean) {
    const { error } = await supabase.from("incidents").update({ is_blocked: !is_blocked }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(!is_blocked ? "Report blocked" : "Report unblocked");
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this report permanently?")) return;
    const { error } = await supabase.from("incidents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await refresh();
  }

  async function saveSettings() {
    if (!settings) return;
    const { error } = await supabase.from("site_settings").update({
      title: settings.title, description: settings.description,
      primary_color: settings.primary_color, accent_color: settings.accent_color,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Design updated");
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">Not an admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in but don't have admin access. If no admin has been set up yet, you can claim it below.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={claimAdmin}>Claim admin role</Button>
            <Button variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  const pending = incidents.filter((i) => !i.reply && !i.is_blocked).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">{incidents.length} reports · {pending} awaiting reply</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports"><MessageSquare className="mr-2 h-4 w-4" />Reports</TabsTrigger>
            <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" />Design</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-6 space-y-4">
            {incidents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No reports yet.
              </div>
            )}
            {incidents.map((i) => (
              <div key={i.id} className={"rounded-2xl border border-border bg-card p-6 shadow-sm " + (i.is_blocked ? "opacity-60" : "")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{i.name}</h3>
                      {i.reply ? <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Replied</Badge>
                        : <Badge variant="secondary">Pending</Badge>}
                      {i.is_blocked && <Badge variant="destructive">Blocked</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Class {i.class_name} · Teacher: {i.class_teacher} · Code <code className="font-mono">{i.tracking_code}</code>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleBlock(i.id, i.is_blocked)}>
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(i.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-lg bg-muted p-4 text-sm">
                  <div><span className="font-medium">Problem:</span> <span className="whitespace-pre-wrap">{i.problem}</span></div>
                  {i.witness && <div><span className="font-medium">Witness:</span> {i.witness}</div>}
                </div>

                {i.reply ? (
                  <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                    <div className="font-medium text-primary">Your reply:</div>
                    <p className="mt-1 whitespace-pre-wrap">{i.reply}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {i.replied_at && new Date(i.replied_at).toLocaleString()}
                    </p>
                    <div className="mt-3">
                      <Label className="text-xs">Update reply</Label>
                      <Textarea rows={2} value={replyDraft[i.id] ?? ""} onChange={(e) => setReplyDraft({ ...replyDraft, [i.id]: e.target.value })} placeholder="Send an updated reply…" />
                      <Button size="sm" className="mt-2" onClick={() => sendReply(i.id)}>Update</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Label className="text-xs">Reply to submitter</Label>
                    <Textarea rows={3} value={replyDraft[i.id] ?? ""} onChange={(e) => setReplyDraft({ ...replyDraft, [i.id]: e.target.value })} placeholder="Write a private reply…" />
                    <Button size="sm" className="mt-2" onClick={() => sendReply(i.id)}>
                      <Reply className="mr-2 h-4 w-4" />Send reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="design" className="mt-6">
            {settings && (
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div>
                  <Label>Site title</Label>
                  <Input value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={3} value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Primary color</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="h-10 w-16 p-1" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} />
                      <Input value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Accent color</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="h-10 w-16 p-1" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} />
                      <Input value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} />
                    </div>
                  </div>
                </div>
                <Button onClick={saveSettings}>Save changes</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
