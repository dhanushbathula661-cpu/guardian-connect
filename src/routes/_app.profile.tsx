import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { EnvelopeSimple, Phone, ShieldCheck, SpinnerGap, UserCircle } from "@phosphor-icons/react";
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
      { name: "description", content: "Manage your PHOENIX account details and emergency contacts." },
      { property: "og:title", content: "Your Profile — PHOENIX" },
      { property: "og:description", content: "Manage your account details and emergency contacts." },
    ],
  }),
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9()\-\s]+$/, "Digits and + ( ) - only")
    .optional()
    .or(z.literal("")),
  emergency_contact_name: z.string().trim().min(2, "Enter emergency contact name").max(100),
  emergency_contact_email: z.string().trim().email("Enter a valid email address").max(255),
  emergency_contact_phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9()\-\s]+$/, "Digits and + ( ) - only")
    .optional()
    .or(z.literal("")),
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
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      updateProfile(user!.id, {
        full_name: values.full_name,
        phone: values.phone || null,
        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_email: values.emergency_contact_email,
        emergency_contact_phone: values.emergency_contact_phone || null,
      }),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile and emergency contact updated successfully.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const savePassword = useMutation({
    mutationFn: (password: string) => updatePassword(password),
    onSuccess: () => toast.success("Password updated successfully."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader title="Profile & Emergency Settings" description="Keep your profile and emergency contact details current for immediate alerts." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const parsed = profileSchema.safeParse({
              full_name: String(form.get("full_name") ?? ""),
              phone: String(form.get("phone") ?? ""),
              emergency_contact_name: String(form.get("emergency_contact_name") ?? ""),
              emergency_contact_email: String(form.get("emergency_contact_email") ?? ""),
              emergency_contact_phone: String(form.get("emergency_contact_phone") ?? ""),
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
          {/* User Details */}
          <Card className="gap-5 p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary">
                <UserCircle size={30} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-base">{profile?.full_name || "Guardian Connect User"}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="e.g. Alex Mercer"
                  maxLength={100}
                />
                {errors["full_name"] ? (
                  <p className="text-xs text-destructive">{errors["full_name"]}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile?.phone ?? ""}
                  placeholder="+1 (555) 019-2834"
                  maxLength={20}
                />
                {errors["phone"] ? <p className="text-xs text-destructive">{errors["phone"]}</p> : null}
              </div>
            </div>
          </Card>

          {/* Emergency Contact Configuration */}
          <Card className="gap-5 p-6 border-amber-500/30 dark:border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <ShieldCheck size={24} weight="duotone" />
              <div>
                <h2 className="text-base font-semibold">Primary Emergency Contact</h2>
                <p className="text-xs text-muted-foreground">This contact receives an immediate email alert when you trigger an emergency SOS.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                <Input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  defaultValue={profile?.emergency_contact_name ?? ""}
                  placeholder="e.g. Jane Mercer"
                  maxLength={100}
                />
                {errors["emergency_contact_name"] ? (
                  <p className="text-xs text-destructive">{errors["emergency_contact_name"]}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_email">Emergency Contact Email *</Label>
                <div className="relative">
                  <Input
                    id="emergency_contact_email"
                    name="emergency_contact_email"
                    type="email"
                    defaultValue={profile?.emergency_contact_email ?? ""}
                    placeholder="emergency-contact@example.com"
                    maxLength={255}
                    className="pr-10"
                  />
                  <EnvelopeSimple size={18} className="absolute right-3 top-3 text-muted-foreground" />
                </div>
                {errors["emergency_contact_email"] ? (
                  <p className="text-xs text-destructive">{errors["emergency_contact_email"]}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <div className="relative">
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    type="tel"
                    defaultValue={profile?.emergency_contact_phone ?? ""}
                    placeholder="+1 (555) 987-6543"
                    maxLength={20}
                    className="pr-10"
                  />
                  <Phone size={18} className="absolute right-3 top-3 text-muted-foreground" />
                </div>
                {errors["emergency_contact_phone"] ? (
                  <p className="text-xs text-destructive">{errors["emergency_contact_phone"]}</p>
                ) : null}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? <SpinnerGap size={18} className="animate-spin" /> : null}
              Save Profile & Contact Settings
            </Button>
          </Card>
        </form>

        {/* Change Password Card */}
        <div className="space-y-6">
          <Card className="gap-5 p-6">
            <h2 className="text-lg font-semibold">Security & Password</h2>
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
                <Label htmlFor="password">New Password</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" maxLength={72} />
                {passwordErrors["password"] ? (
                  <p className="text-xs text-destructive">{passwordErrors["password"]}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" maxLength={72} />
                {passwordErrors["confirm"] ? (
                  <p className="text-xs text-destructive">{passwordErrors["confirm"]}</p>
                ) : null}
              </div>
              <Button type="submit" variant="outline" disabled={savePassword.isPending}>
                {savePassword.isPending ? <SpinnerGap size={18} className="animate-spin" /> : null}
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
