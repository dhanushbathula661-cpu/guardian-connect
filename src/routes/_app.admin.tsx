import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, ShieldStar, Siren, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { StatCard } from "@/components/phoenix/StatCard";
import { StatusBadge } from "@/components/phoenix/StatusBadge";
import { EmptyState } from "@/components/phoenix/EmptyState";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/phoenix/auth";
import { adminDashboard, updateIncidentStatus, updateSosStatus } from "@/lib/phoenix/api";
import {
  INCIDENT_STATUSES,
  INCIDENT_STATUS_TONE,
  SOS_STATUSES,
  SOS_STATUS_TONE,
  formatDateTime,
  labelize,
} from "@/lib/phoenix/constants";
import type { Incident, IncidentStatus, SosAlert, SosStatus } from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Command Center — PHOENIX" },
      { name: "description", content: "Monitor live SOS alerts, incident reports and users." },
      { property: "og:title", content: "Command Center — PHOENIX" },
      { property: "og:description", content: "Monitor live SOS alerts and incident reports." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminDashboard,
    enabled: isAdmin,
    refetchInterval: 20000,
  });

  const setSos = useMutation({
    mutationFn: ({ alert, status }: { alert: SosAlert; status: SosStatus }) =>
      updateSosStatus(alert, status, null, user!.id),
    onSuccess: () => {
      toast.success("SOS status updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setIncident = useMutation({
    mutationFn: ({ incident, status }: { incident: Incident; status: IncidentStatus }) =>
      updateIncidentStatus(incident, status, null),
    onSuccess: () => {
      toast.success("Report status updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldStar}
        title="Admins only"
        description="You don't have permission to view the safety command center."
      />
    );
  }

  return (
    <>
      <PageHeader title="Command center" description="Live safety operations across all users." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active SOS" value={data?.activeSos ?? 0} icon={Siren} tone="emergency" index={0} />
        <StatCard label="Pending reports" value={data?.pendingIncidents ?? 0} icon={WarningCircle} tone="warning" index={1} />
        <StatCard label="Resolved reports" value={data?.resolvedIncidents ?? 0} icon={CheckCircle} tone="success" index={2} />
        <StatCard label="Registered users" value={data?.totalUsers ?? 0} icon={UsersThree} index={3} />
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-semibold">SOS alerts</h2>
        <div className="mt-4 space-y-3">
          {data?.alerts.length ? (
            data.alerts.slice(0, 15).map((alert) => (
              <div
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{labelize(alert.emergency_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(alert.created_at)}
                    {alert.address ? ` · ${alert.address}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={alert.status} tone={SOS_STATUS_TONE[alert.status]} />
                  <Select
                    value={alert.status}
                    onValueChange={(value) => setSos.mutate({ alert, status: value as SosStatus })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOS_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {labelize(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No SOS alerts recorded.</p>
          )}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold">Incident reports</h2>
        <div className="mt-4 space-y-3">
          {data?.incidents.length ? (
            data.incidents.slice(0, 15).map((incident) => (
              <div
                key={incident.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {incident.reference} · {labelize(incident.category)} ·{" "}
                    {formatDateTime(incident.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={incident.status} tone={INCIDENT_STATUS_TONE[incident.status]} />
                  <Select
                    value={incident.status}
                    onValueChange={(value) =>
                      setIncident.mutate({ incident, status: value as IncidentStatus })
                    }
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {labelize(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No incident reports yet.</p>
          )}
        </div>
      </Card>
    </>
  );
}
