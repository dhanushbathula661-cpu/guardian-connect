import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Eye, EyeSlash, GoogleLogo, ShieldCheck, Siren, SpinnerGap } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoenixLogo } from "@/components/brand/PhoenixLogo";
import { useAuth } from "@/lib/phoenix/auth";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — PHOENIX Safety" },
      {
        name: "description",
        content: "Log in or create your PHOENIX account to access emergency SOS and incident reporting.",
      },
      { property: "og:title", content: "Sign in — PHOENIX Safety" },
      {
        property: "og:description",
        content: "Access emergency SOS, live location sharing and incident reporting.",
      },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20)
      .regex(/^[+0-9()\-\s]+$/, "Phone can only contain digits and + ( ) -"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72)
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password"),
});

type Errors = Record<string, string>;

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    setMode(search.mode ?? "login");
  }, [search.mode]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: search.redirect ?? "/dashboard", replace: true });
    }
  }, [loading, isAuthenticated, navigate, search.redirect]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setErrors({});

    if (mode === "register") {
      const parsed = registerSchema.safeParse({
        fullName: String(form.get("fullName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password") ?? ""),
        confirm: String(form.get("confirm") ?? ""),
      });
      if (!parsed.success) {
        const next: Errors = {};
        for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
        setErrors(next);
        return;
      }
      setSubmitting(true);
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
        },
      });
      setSubmitting(false);
      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? "That email already has an account. Try logging in."
            : error.message,
        );
        return;
      }
      toast.success("Account created. Welcome to PHOENIX.");
      void navigate({ to: "/dashboard" });
      return;
    }

    const parsed = loginSchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Incorrect email or password."
          : error.message,
      );
      return;
    }
    toast.success("Welcome back.");
    void navigate({ to: search.redirect ?? "/dashboard" });
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${search.redirect ?? "/dashboard"}`,
      },
    });
    if (error) {
      setSubmitting(false);
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-aura relative hidden flex-col justify-between p-12 lg:flex">
        <Link to="/">
          <PhoenixLogo subtitle />
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Help is <span className="text-gradient-primary">one tap</span> away.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            {[
              { icon: Siren, text: "Instant SOS alerts with GPS coordinates" },
              { icon: ShieldCheck, text: "Private, row-level secured emergency data" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary">
                  <item.icon size={18} weight="duotone" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          In immediate danger? Always call your local emergency number first.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden">
            <Link to="/">
              <PhoenixLogo />
            </Link>
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold lg:mt-0">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Log in to reach your safety dashboard."
              : "Set up PHOENIX so help can find you fast."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface/60 p-1">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setErrors({});
                  void navigate({ to: "/auth", search: { mode: value }, replace: true });
                }}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {mode === "register" ? (
              <Field label="Full name" error={errors["fullName"]}>
                <Input name="fullName" placeholder="Alex Mercer" autoComplete="name" maxLength={100} />
              </Field>
            ) : null}
            <Field label="Email" error={errors["email"]}>
              <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={255} />
            </Field>
            {mode === "register" ? (
              <Field label="Phone number" error={errors["phone"]}>
                <Input name="phone" type="tel" placeholder="+1 555 0100" autoComplete="tel" maxLength={20} />
              </Field>
            ) : null}
            <Field label="Password" error={errors["password"]}>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  maxLength={72}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {mode === "register" ? (
              <Field label="Confirm password" error={errors["confirm"]}>
                <Input name="confirm" type="password" autoComplete="new-password" maxLength={72} />
              </Field>
            ) : null}

            <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
              {submitting ? <SpinnerGap size={18} className="animate-spin" /> : null}
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full text-base"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <GoogleLogo size={20} weight="bold" /> Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to PHOENIX?" : "Already have an account?"}{" "}
            <Link
              to="/auth"
              search={{ mode: mode === "login" ? "register" : "login" }}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
