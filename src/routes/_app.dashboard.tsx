import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bell,
  CheckCircle,
  ClockCounterClockwise,
  MapPin,
  Siren,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { StatCard } from "@/components/phoenix/StatCard";
import { StatusBadge } from "@/components/phoenix/StatusBadge";
import { EmptyState } from "@/components/phoenix/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/phoenix/auth";
import { userDashboard } from "@/lib/phoenix/api";
import {
  INCIDENT_STATUS_TONE,
  SOS_STATUS_TONE,
  labelize,
  timeAgo,
} from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Safety Dashboard — PHOENIX" },
      { name: "description", content: "Your live safety overview: SOS alerts, reports and contacts." },
      { property: "og:title", content: "Safety Dashboard — PHOENIX" },
      { property: "og:description", content: "Your live safety overview in PHOENIX." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => userDashboard(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 20000,
  });

  const active = data?.alerts.find((alert) =>
    ["ACTIVE", "ACKNOWLEDGED", "RESPONDING"].includes(alert.status),
  );
  const firstName = (profile?.full_name ?? "there").split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Here's your current safety status."
        action={
          <Button asChild variant="emergency" size="lg">
            <Link to="/sos">
              <Siren size={20} weight="fill" /> Emergency SOS
            </Link>
          </Button>
        }
      />

      {active ? (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-8 flex-row items-center justify-between gap-4 border-emergency/50 bg-emergency/10 p-5">
            <div className="flex items-center gap-4">
              <span className="sos-pulse grid h-11 w-11 place-items-center rounded-full bg-emergency text-emergency-foreground">
                <Siren size={22} weight="fill" />
              </span>
              <div>
                <p className="font-semibold">Active SOS alert in progress</p>
                <p className="text-sm text-muted-foreground">
                  {labelize(active.emergency_type)} · raised {timeAgo(active.created_at)}
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/sos">View</Link>
            </Button>
          </Card>
        </motion.div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total reports" value={data?.totalReports ?? 0} icon={WarningCircle} index={0} />
          <StatCard
            label="Pending"
            value={data?.pendingReports ?? 0}
            icon={ClockCounterClockwise}
            tone="warning"
            index={1}
          />
          <StatCard
            label="Resolved"
            value={data?.resolvedReports ?? 0}
            icon={CheckCircle}
            tone="success"
            index={2}
          />
          <StatCard
            label="Emergency contacts"
            value={data?.contacts.length ?? 0}
            icon={UsersThree}
            index={3}
            hint={data?.contacts.length ? undefined : "Add one to be safer"}
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent reports</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/incidents">
                View all <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {data?.incidents.length ? (
              data.incidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  to="/incidents/$incidentId"
                  params={{ incidentId: incident.id }}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface/40 p-4 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {incident.reference} · {labelize(incident.category)} · {timeAgo(incident.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={incident.status} tone={INCIDENT_STATUS_TONE[incident.status]} />
                </Link>
              ))
            ) : (
              <EmptyState
                icon={WarningCircle}
                title="No reports yet"
                description="File a report when you witness an accident, crime or hazard."
                action={
                  <Button asChild>
                    <Link to="/incidents/new">Report an incident</Link>
                  </Button>
                }
              />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <QuickAction to="/incidents/new" icon={WarningCircle} label="Report incident" />
              <QuickAction to="/contacts" icon={UsersThree} label="Manage contacts" />
              <QuickAction to="/map" icon={MapPin} label="Nearby services" />
              <QuickAction to="/notifications" icon={Bell} label="Notifications" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold">Recent SOS activity</h2>
            <div className="mt-4 space-y-3">
              {data?.alerts.length ? (
                data.alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{labelize(alert.emergency_type)}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(alert.created_at)}</p>
                    </div>
                    <StatusBadge status={alert.status} tone={SOS_STATUS_TONE[alert.status]} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No SOS alerts raised. Stay safe.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  to,
  icon: IconComponent,
  label,
}: {
  to: string;
  icon: typeof WarningCircle;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
    >
      <IconComponent size={18} weight="duotone" />
      {label}
      <ArrowRight size={16} className="ml-auto text-muted-foreground" />
    </Link>
  );
}
