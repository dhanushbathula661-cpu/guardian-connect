import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CheckCircle,
  Crosshair,
  MapPin,
  ShieldWarning,
  Siren,
  SpinnerGap,
  XCircle,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { StatusBadge } from "@/components/phoenix/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/lib/phoenix/auth";
import {
  createSos,
  getActiveSos,
  listContacts,
  listMySos,
  listSosHistory,
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
      { title: "Emergency SOS — PHOENIX" },
      { name: "description", content: "Trigger a one-tap emergency SOS with live GPS location." },
      { property: "og:title", content: "Emergency SOS — PHOENIX" },
      { property: "og:description", content: "One-tap emergency SOS with live GPS location." },
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const [type, setType] = useState<string>("GENERAL");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [location, setLocation] = useState<Located | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);

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

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["sos-active"] });
    void queryClient.invalidateQueries({ queryKey: ["sos-history"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const trigger = useMutation({
    mutationFn: async () =>
      createSos(user!.id, {
        emergency_type: type,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy: location?.accuracy ?? null,
        address: location?.address ?? null,
        message: message.trim() ? message.trim().slice(0, 500) : null,
      }),
    onSuccess: () => {
      toast.success("SOS sent. Your contacts have been notified.");
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
        description="Hold the button for one second, then confirm. Help gets your location instantly."
      />

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
                  className={`absolute h-52 w-52 rounded-full bg-emergency/20 ${
                    reduced ? "" : "sos-pulse"
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
                placeholder="Anything responders should know…"
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
                You can still send an SOS, but responders won't get coordinates.
              </p>
            ) : null}
          </Card>

          <Card className="gap-2 p-6">
            <h2 className="text-lg font-semibold">Contacts to notify</h2>
            {contacts.length ? (
              <ul className="space-y-2 text-sm">
                {contacts.slice(0, 4).map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{contact.name}</span>
                    <span className="text-xs text-muted-foreground">{contact.phone}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No emergency contacts yet — add them so alerts reach someone.
              </p>
            )}
          </Card>
        </div>
      </div>

      {history.length ? (
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold">SOS history</h2>
          <ul className="mt-4 divide-y divide-border">
            {history.map((alert) => (
              <li key={alert.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{labelize(alert.emergency_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(alert.created_at)}
                    {alert.address ? ` · ${alert.address}` : ""}
                  </p>
                </div>
                <StatusBadge status={alert.status} tone={SOS_STATUS_TONE[alert.status]} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Siren size={22} weight="fill" className="text-emergency" />
              Send emergency SOS?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This alerts {contacts.length} emergency contact{contacts.length === 1 ? "" : "s"} and the
              PHOENIX safety command center with your live location. Only use it in a real emergency.
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
              Yes, send SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
