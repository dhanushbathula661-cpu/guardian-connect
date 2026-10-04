import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SpinnerGap } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/phoenix/auth";

const searchSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_code: z.string().optional(),
  error_description: z.string().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Authenticating — Guardian Connect" },
      { name: "description", content: "Completing Google OAuth authentication." },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      // 1. Check if OAuth provider returned an error parameter (e.g. user cancelled)
      if (search.error || search.error_description) {
        const message =
          search.error === "access_denied"
            ? "Google authentication was cancelled."
            : search.error_description || "Google authentication failed.";

        if (active) {
          setErrorMessage(message);
          toast.error(message);
          setTimeout(() => {
            void navigate({ to: "/auth", search: { mode: "login" }, replace: true });
          }, 1500);
        }
        return;
      }

      // 2. Process authorization code if present
      if (search.code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(search.code);
          if (error) {
            console.error("[OAuth Callback Error]:", error);
            if (active) {
              setErrorMessage(error.message || "Failed to complete authentication code exchange.");
              toast.error(error.message || "Authentication failed.");
              setTimeout(() => {
                void navigate({ to: "/auth", search: { mode: "login" }, replace: true });
              }, 1500);
            }
            return;
          }
        } catch (err: unknown) {
          console.error("[OAuth Exception]:", err);
        }
      }

      // 3. Check existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await refreshProfile();
        if (active) {
          toast.success("Signed in successfully with Google.");
          const target = search.redirect || "/dashboard";
          void navigate({ to: target, replace: true });
        }
      } else {
        // Fallback: wait briefly for session initialization
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            await refreshProfile();
            if (active) {
              toast.success("Signed in successfully.");
              void navigate({ to: search.redirect || "/dashboard", replace: true });
            }
          } else if (active) {
            toast.error("Could not establish authentication session.");
            void navigate({ to: "/auth", search: { mode: "login" }, replace: true });
          }
        }, 1000);
      }
    }

    void handleCallback();

    return () => {
      active = false;
    };
  }, [search, navigate, refreshProfile]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {errorMessage ? (
          <>
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <span className="text-xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold">Authentication Issue</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <p className="text-xs text-muted-foreground">Redirecting back to login...</p>
          </>
        ) : (
          <>
            <SpinnerGap size={36} className="animate-spin text-primary" />
            <h2 className="text-lg font-semibold">Completing sign in...</h2>
            <p className="text-sm text-muted-foreground">Please wait while we establish your secure session.</p>
          </>
        )}
      </div>
    </div>
  );
}
