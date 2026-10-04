import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CheckCircle,
  Crosshair,
  EnvelopeSimple,
  MapPin,
  PaperPlaneTilt,
  ShieldWarning,
  Siren,
  SpinnerGap,
  UserGear,
  XCircle,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { StatusBadge } from "@/components/phoenix/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/phoenix/auth";
import {
  createSos,
  getActiveSos,
  listContacts,
  listMyEmergencyAlerts,
  listMySos,
  listSosHistory,
  sendEmergencyAlertEmail,
  updateProfile,
  updateSosStatus,
} from "@/lib/phoenix/api";
import { getCurrentPosition, reverseGeocode } from "@/lib/phoenix/geolocation";
import {
  EMERGENCY_TYPES,
  SOS_STATUS_TONE,
  formatDateTime,
  labelize,
  timeAgo,
} from "@/lib/phoenix/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const Route = createFileRoute("/_app/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS — Guardian Connect" },
      { name: "description", content: "Trigger a one-tap emergency SOS with live GPS location and email alerts." },
      { property: "og:title", content: "Emergency SOS — Guardian Connect" },
      { property: "og:description", content: "One-tap emergency SOS with live GPS location and email alerts." },
    ],
  }),
  component: SosPage,
});

interface Located {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string | null;
}

function SosPage() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const [type, setType] = useState<string>("GENERAL");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quickContactOpen, setQuickContactOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);
  const [location, setLocation] = useState<Located | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);

  const saveQuickContact = useMutation({
    mutationFn: async () => {
      if (!quickName.trim()) throw new Error("Please enter contact name.");
      if (!quickEmail.trim() || !quickEmail.includes("@")) throw new Error("Please enter a valid email address.");
      await updateProfile(user!.id, {
        full_name: profile?.full_name || "User",
        phone: profile?.phone ?? null,
        emergency_contact_name: quickName.trim(),
        emergency_contact_email: quickEmail.trim(),
        emergency_contact_phone: quickPhone.trim() || null,
      });
      await refreshProfile();
    },
    onSuccess: () => {
      toast.success("Emergency contact saved! Emergency SOS feature is enabled.");
      setQuickContactOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const captureLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude);
      setLocation({ ...position, address });
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Could not get your location.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    void captureLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: active } = useQuery({
    queryKey: ["sos-active", user?.id],
    queryFn: () => getActiveSos(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 15000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["sos-history", user?.id],
    queryFn: () => listMySos(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: emergencyEmailAlerts = [] } = useQuery({
    queryKey: ["emergency-alerts-history", user?.id],
    queryFn: () => listMyEmergencyAlerts(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: () => listContacts(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["sos-timeline", active?.id],
    queryFn: () => listSosHistory(active!.id),
    enabled: Boolean(active?.id),
    refetchInterval: 15000,
  });

  // Effective emergency contact email
  const configuredEmail = profile?.emergency_contact_email?.trim() || contacts.find((c) => c.email)?.email?.trim() || null;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["sos-active"] });
    void queryClient.invalidateQueries({ queryKey: ["sos-history"] });
    void queryClient.invalidateQueries({ queryKey: ["emergency-alerts-history"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const trigger = useMutation({
    mutationFn: async () => {
      // 1. Create SOS Record in database
      const sosAlert = await createSos(user!.id, {
        emergency_type: type,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy: location?.accuracy ?? null,
        address: location?.address ?? null,
        message: message.trim() ? message.trim().slice(0, 500) : null,
      });

      // 2. Invoke Supabase Edge Function to send Emergency Email via Resend
      let emailResult;
      try {
        emailResult = await sendEmergencyAlertEmail({
          message: message.trim() || `Emergency ${type} alert triggered by ${profile?.full_name || "user"}.`,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
        });
      } catch (err: unknown) {
        console.error("Edge function emergency email failed:", err);
        const errMsg = err instanceof Error ? err.message : "Failed to dispatch email alert";
        toast.error(`Email dispatch warning: ${errMsg}`);
      }

      return { sosAlert, emailResult };
    },
    onSuccess: (data) => {
      if (data.emailResult?.success) {
        toast.success(`SOS broadcasted & emergency email dispatched to ${data.emailResult.alert.email_sent_to}`);
      } else {
        toast.success("Emergency SOS broadcasted.");
      }
      setMessage("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancel = useMutation({
    mutationFn: async () =>
      updateSosStatus(active!, "CANCELLED", "Cancelled by the user.", user!.id),
    onSuccess: () => {
      toast.success("SOS cancelled.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const startHold = () => {
    if (active) return;
    if (!user) {
      toast.error("Please login before using the emergency feature.");
      return;
    }
    if (!configuredEmail) {
      toast.error("Please configure an emergency contact before using this feature.");
      setQuickName(profile?.emergency_contact_name || "");
      setQuickEmail(profile?.emergency_contact_email || "");
      setQuickPhone(profile?.emergency_contact_phone || "");
      setQuickContactOpen(true);
      return;
    }
    const started = Date.now();
    holdTimer.current = window.setInterval(() => {
      const progress = Math.min((Date.now() - started) / 1200, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        stopHold();
        setConfirmOpen(true);
      }
    }, 30);
  };

  const stopHold = () => {
    if (holdTimer.current) window.clearInterval(holdTimer.current);
    holdTimer.current = null;
    setHoldProgress(0);
  };

  useEffect(() => () => stopHold(), []);

  return (
    <>
      <PageHeader
        title="Emergency SOS"
        description="Hold the button for one second to send an instant location alert & email emergency dispatch."
      />

      {/* Warning Banner if Emergency Contact Missing */}
      {!configuredEmail ? (
        <Card className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <ShieldWarning size={28} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Emergency contact email required</p>
              <p className="text-xs text-muted-foreground">
                Please configure an emergency contact email in your profile so server alerts can be dispatched immediately.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => {
              setQuickName(profile?.emergency_contact_name || "");
              setQuickEmail(profile?.emergency_contact_email || "");
              setQuickPhone(profile?.emergency_contact_phone || "");
              setQuickContactOpen(true);
            }}
          >
            <UserGear size={16} /> Configure Contact
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="items-center gap-6 p-8 text-center">
          {active ? (
            <div className="w-full">
              <StatusBadge status={active.status} tone={SOS_STATUS_TONE[active.status]} />
              <h2 className="mt-4 font-display text-2xl font-bold">
                {labelize(active.emergency_type)} emergency active
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Raised {timeAgo(active.created_at)} · {active.contacts_notified} contact
                {active.contacts_notified === 1 ? "" : "s"} notified
              </p>
              {active.address ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm">
                  <MapPin size={16} className="text-primary" /> {active.address}
                </p>
              ) : null}

              <ol className="mt-6 space-y-3 text-left">
                {timeline.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">{labelize(entry.status)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Button
                variant="outline"
                className="mt-7"
                onClick={() => cancel.mutate()}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? <SpinnerGap size={18} className="animate-spin" /> : <XCircle size={18} />}
                I'm safe — cancel SOS
              </Button>
            </div>
          ) : (
            <>
              <div className="relative grid place-items-center">
                <span
                  className={`absolute h-52 w-52 rounded-full bg-emergency/20 ${reduced ? "" : "sos-pulse"
                    }`}
                  aria-hidden
                />
                <motion.button
                  type="button"
                  aria-label="Hold to trigger emergency SOS"
                  onPointerDown={startHold}
                  onPointerUp={stopHold}
                  onPointerLeave={stopHold}
                  whileTap={{ scale: 0.96 }}
                  className="relative grid h-44 w-44 place-items-center rounded-full bg-emergency text-emergency-foreground shadow-[0_25px_60px_-20px_var(--emergency)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emergency/40"
                >
                  <span className="flex flex-col items-center gap-1">
                    <Siren size={44} weight="fill" />
                    <span className="font-display text-xl font-bold tracking-[0.18em]">SOS</span>
                  </span>
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                    <circle
                      cx="50"
                      cy="50"
                      r="47"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={295}
                      strokeDashoffset={295 - holdProgress * 295}
                      opacity="0.85"
                    />
                  </svg>
                </motion.button>
              </div>
              <p className="text-sm text-muted-foreground">
                Press and hold for 1 second to arm the alert.
              </p>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="gap-4 p-6">
            <h2 className="text-lg font-semibold">Alert details</h2>
            <div className="space-y-1.5">
              <Label>Emergency type</Label>
              <Select value={type} onValueChange={setType} disabled={Boolean(active)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMERGENCY_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {labelize(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Message (optional)</Label>
              <Textarea
                value={message}
                maxLength={500}
                disabled={Boolean(active)}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Anything emergency contacts should know…"
              />
            </div>
          </Card>

          <Card className="gap-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your location</h2>
              <Button variant="ghost" size="sm" onClick={captureLocation} disabled={locating}>
                {locating ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <Crosshair size={16} />
                )}
                Refresh
              </Button>
            </div>
            {location ? (
              <div className="text-sm">
                <p className="font-medium">{location.address ?? "Coordinates captured"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} · ±
                  {Math.round(location.accuracy)}m
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {locationError ?? "Getting your position…"}
              </p>
            )}
            {locationError ? (
              <p className="flex items-start gap-2 text-xs text-warning">
                <ShieldWarning size={16} className="mt-0.5 shrink-0" />
                You can still send an SOS, but the email will indicate location was unavailable.
              </p>
            ) : null}
          </Card>

          <Card className="gap-2 p-6">
            <h2 className="text-lg font-semibold">Configured Recipient</h2>
            {configuredEmail ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <EnvelopeSimple size={16} className="text-primary" /> {configuredEmail}
                </p>
                <p className="text-xs text-muted-foreground">
                  Receives emergency email dispatch via Supabase Edge Function & Resend API.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No emergency contact configured yet.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Emergency Email Alert History Section */}
      {emergencyEmailAlerts.length ? (
        <Card className="mt-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PaperPlaneTilt size={20} className="text-primary" /> Server Emergency Alert History
              </h2>
              <p className="text-xs text-muted-foreground">
                Emergency emails processed by Supabase Edge Function & Resend API.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Recipient</th>
                  <th className="pb-3 font-semibold">Message</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {emergencyEmailAlerts.map((alert) => {
                  const hasLoc = alert.latitude !== null && alert.longitude !== null;
                  const isSent = alert.status === "sent";
                  const isFailed = alert.status === "failed";

                  return (
                    <tr key={alert.id} className="hover:bg-surface/50">
                      <td className="py-3 pr-4 text-xs font-mono whitespace-nowrap">
                        {formatDateTime(alert.created_at)}
                      </td>
                      <td className="py-3 pr-4 text-xs font-medium truncate max-w-[200px]">
                        {alert.email_sent_to || "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground truncate max-w-[250px]">
                        {alert.message || "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {hasLoc ? (
                          <a
                            href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                          >
                            <MapPin size={14} /> {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-sans">Unavailable</span>
                        )}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${isSent
                              ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                              : isFailed
                                ? "bg-red-500/12 text-red-600 dark:text-red-400"
                                : "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                            }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Siren size={22} weight="fill" className="text-emergency" />
              Send Emergency SOS & Alert Email?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will trigger a live SOS alert and send an emergency email to{" "}
              <strong className="text-foreground">{configuredEmail}</strong> via Supabase Edge Function & Resend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
              onClick={() => trigger.mutate()}
            >
              {trigger.isPending ? (
                <SpinnerGap size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Yes, send Emergency Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Configure Emergency Contact Dialog */}
      <Dialog open={quickContactOpen} onOpenChange={setQuickContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EnvelopeSimple size={22} className="text-primary" /> Configure Emergency Contact Email
            </DialogTitle>
            <DialogDescription>
              Set the emergency contact recipient who will receive automated email alerts whenever you trigger an SOS.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveQuickContact.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="quick_name">Contact Full Name *</Label>
              <Input
                id="quick_name"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g. Jane Mercer"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick_email">Emergency Contact Email *</Label>
              <Input
                id="quick_email"
                type="email"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                placeholder="contact@example.com"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick_phone">Contact Phone (Optional)</Label>
              <Input
                id="quick_phone"
                type="tel"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="+1 555 0192"
                maxLength={20}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setQuickContactOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveQuickContact.isPending}>
                {saveQuickContact.isPending ? <SpinnerGap size={18} className="animate-spin" /> : null}
                Save Contact & Enable SOS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
