import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { SpinnerGap, UserCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/phoenix/auth";
import { updatePassword, updateProfile } from "@/lib/phoenix/api";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — PHOENIX" },
      { name: "description", content: "Manage your PHOENIX account details and password." },
      { property: "og:title", content: "Your Profile — PHOENIX" },
      { property: "og:description", content: "Manage your account details and password." },
    ],
  }),
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9()\-\s]+$/, "Digits and + ( ) - only"),
});

const passwordSchema = z
  .object({
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

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const saveProfile = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) => updateProfile(user!.id, values),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const savePassword = useMutation({
    mutationFn: (password: string) => updatePassword(password),
    onSuccess: () => toast.success("Password updated."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader title="Profile" description="Keep your details current so responders can reach you." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-5 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary">
              <UserCircle size={30} weight="duotone" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{profile?.full_name ?? "PHOENIX user"}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const parsed = profileSchema.safeParse({
                full_name: String(form.get("full_name") ?? ""),
                phone: String(form.get("phone") ?? ""),
              });
              if (!parsed.success) {
                const next: Record<string, string> = {};
                for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
                setErrors(next);
                return;
              }
              setErrors({});
              saveProfile.mutate(parsed.data);
            }}
          >
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input name="full_name" defaultValue={profile?.full_name ?? ""} maxLength={100} />
              {errors["full_name"] ? (
                <p className="text-xs text-destructive">{errors["full_name"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} maxLength={20} />
              {errors["phone"] ? <p className="text-xs text-destructive">{errors["phone"]}</p> : null}
            </div>
            <Button type="submit" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? <SpinnerGap size={18} className="animate-spin" /> : null}
              Save changes
            </Button>
          </form>
        </Card>

        <Card className="gap-5 p-6">
          <h2 className="text-lg font-semibold">Change password</h2>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const parsed = passwordSchema.safeParse({
                password: String(form.get("password") ?? ""),
                confirm: String(form.get("confirm") ?? ""),
              });
              if (!parsed.success) {
                const next: Record<string, string> = {};
                for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
                setPasswordErrors(next);
                return;
              }
              setPasswordErrors({});
              savePassword.mutate(parsed.data.password);
              event.currentTarget.reset();
            }}
          >
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input name="password" type="password" autoComplete="new-password" maxLength={72} />
              {passwordErrors["password"] ? (
                <p className="text-xs text-destructive">{passwordErrors["password"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm password</Label>
              <Input name="confirm" type="password" autoComplete="new-password" maxLength={72} />
              {passwordErrors["confirm"] ? (
                <p className="text-xs text-destructive">{passwordErrors["confirm"]}</p>
              ) : null}
            </div>
            <Button type="submit" variant="outline" disabled={savePassword.isPending}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
