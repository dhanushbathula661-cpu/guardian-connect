import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { MagnifyingGlass, Plus, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { EmptyState } from "@/components/phoenix/EmptyState";
import { StatusBadge } from "@/components/phoenix/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/phoenix/auth";
import { listMyIncidents } from "@/lib/phoenix/api";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  INCIDENT_STATUS_TONE,
  formatDateTime,
  labelize,
} from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/incidents/")({
  head: () => ({
    meta: [
      { title: "My Incident Reports — PHOENIX" },
      { name: "description", content: "Track every incident you reported and its current status." },
      { property: "og:title", content: "My Incident Reports — PHOENIX" },
      { property: "og:description", content: "Track your reported incidents and their status." },
    ],
  }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents", user?.id],
    queryFn: () => listMyIncidents(user!.id),
    enabled: Boolean(user?.id),
  });

  const filtered = useMemo(
    () =>
      incidents.filter((incident) => {
        const matchesQuery =
          !query ||
          incident.title.toLowerCase().includes(query.toLowerCase()) ||
          incident.reference.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "ALL" || incident.status === status;
        const matchesCategory = category === "ALL" || incident.category === category;
        return matchesQuery && matchesStatus && matchesCategory;
      }),
    [incidents, query, status, category],
  );

  return (
    <>
      <PageHeader
        title="My reports"
        description="Every incident you've reported, with live status."
        action={
          <Button asChild>
            <Link to="/incidents/new">
              <Plus size={18} /> New report
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_180px_200px]">
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or reference"
            className="pl-10"
            maxLength={80}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {INCIDENT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {labelize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {INCIDENT_CATEGORIES.map((value) => (
              <SelectItem key={value} value={value}>
                {labelize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? null : filtered.length === 0 ? (
        <EmptyState
          icon={WarningCircle}
          title={incidents.length ? "No matching reports" : "No reports yet"}
          description={
            incidents.length
              ? "Try clearing the filters or searching a different term."
              : "Report accidents, crimes, hazards and emergencies with evidence."
          }
          action={
            incidents.length ? undefined : (
              <Button asChild>
                <Link to="/incidents/new">Report an incident</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((incident, index) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link to="/incidents/$incidentId" params={{ incidentId: incident.id }}>
                <Card className="h-full gap-2 p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{incident.title}</p>
                      <p className="text-xs text-muted-foreground">{incident.reference}</p>
                    </div>
                    <StatusBadge status={incident.status} tone={INCIDENT_STATUS_TONE[incident.status]} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {incident.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {labelize(incident.category)} · {formatDateTime(incident.occurred_at)}
                  </p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
