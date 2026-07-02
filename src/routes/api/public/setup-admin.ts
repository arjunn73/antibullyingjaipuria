import { createFileRoute } from "@tanstack/react-router";

const ADMIN_EMAIL = "digital.campaign@jaipuria.local";
const ADMIN_PASSWORD = "digital.campaign26";

async function handle() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Look up existing user by email
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });

  let user = list.users.find((u) => u.email === ADMIN_EMAIL);

  if (!user) {
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (cErr) return new Response(JSON.stringify({ error: cErr.message }), { status: 500 });
    user = created.user!;
  } else {
    // Ensure password is up-to-date
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
  }

  // Grant admin role
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" as never }, { onConflict: "user_id,role" });

  return new Response(JSON.stringify({ ok: true, user_id: user.id }), {
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
