import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bullying Prevention Online Help Desk" },
      { name: "description", content: "If you’re going through something, you’re not alone.\n\nSeth M.R. Jaipuria School, Digital Campaign Club, brings you a safe, confidential place to report bullying.\n\nRest assured, we’re here to listen and support you." },
      { property: "og:site_name", content: "Seth M.R. Jaipuria School — Digital Campaign Club" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Bullying Prevention Online Help Desk" },
      { name: "twitter:title", content: "Bullying Prevention Online Help Desk" },
      { property: "og:description", content: "If you’re going through something, you’re not alone.\n\nSeth M.R. Jaipuria School, Digital Campaign Club, brings you a safe, confidential place to report bullying.\n\nRest assured, we’re here to listen and support you." },
      { name: "twitter:description", content: "If you’re going through something, you’re not alone.\n\nSeth M.R. Jaipuria School, Digital Campaign Club, brings you a safe, confidential place to report bullying.\n\nRest assured, we’re here to listen and support you." },
      { property: "og:image", content: "https://antibullyingjaipuria.lovable.app/__l5e/assets-v1/6c1ca2e2-20f6-4a20-9a3f-4b04f2d54fe0/og-home.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Bullying Prevention Online Help Desk — Seth M.R. Jaipuria School, Digital Campaign Club" },
      { name: "twitter:image", content: "https://antibullyingjaipuria.lovable.app/__l5e/assets-v1/6c1ca2e2-20f6-4a20-9a3f-4b04f2d54fe0/og-home.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Seth M.R. Jaipuria School — Digital Campaign Club",
          url: "https://digitalcampaign.lovable.app",
          description: "Digital Campaign Club at Seth M.R. Jaipuria School — running the anti-bullying reporting initiative.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", prevent);
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || k === "u")) e.preventDefault();
      if (k === "printscreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        document.body.classList.add("privacy-blur");
        setTimeout(() => document.body.classList.remove("privacy-blur"), 1500);
      }
    };
    document.addEventListener("keydown", onKey);
    const onBlur = () => document.body.classList.add("privacy-blur");
    const onFocus = () => document.body.classList.remove("privacy-blur");
    const onVis = () => {
      if (document.visibilityState === "hidden") document.body.classList.add("privacy-blur");
      else document.body.classList.remove("privacy-blur");
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
