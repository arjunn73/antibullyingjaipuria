import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { reportsDb } from "@/lib/reports-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await reportsDb.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
