import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Paperclip } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { StatusBadge } from "@/components/phoenix/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIncident, listIncidentMedia, signedUrl } from "@/lib/phoenix/api";
import { INCIDENT_STATUS_TONE, formatDateTime, labelize } from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/incidents/$incidentId")({
  head: () => ({
    meta: [
      { title: "Incident Report — PHOENIX" },
      { name: "description", content: "Full details, evidence and status of your incident report." },
      { property: "og:title", content: "Incident Report — PHOENIX" },
      { property: "og:description", content: "Full details and status of an incident report." },
    ],
  }),
  component: IncidentDetailPage,
});

function IncidentDetailPage() {
  const { incidentId } = Route.useParams();

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncident(incidentId),
  });

  const { data: media = [] } = useQuery({
    queryKey: ["incident-media", incidentId],
    queryFn: async () => {
      const rows = await listIncidentMedia(incidentId);
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          url: await signedUrl("incident-media", row.storage_path),
        })),
      );
    },
  });

  if (isLoading) return null;
  if (!incident) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium">This report could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/incidents">Back to reports</Link>
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/incidents">
          <ArrowLeft size={16} /> All reports
        </Link>
      </Button>
      <PageHeader
        title={incident.title}
        description={`${incident.reference} · ${labelize(incident.category)}`}
        action={<StatusBadge status={incident.status} tone={INCIDENT_STATUS_TONE[incident.status]} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-4 p-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{incident.description}</p>
          </div>
          {incident.additional_details ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Additional details
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {incident.additional_details}
              </p>
            </div>
          ) : null}
          {incident.admin_notes ? (
            <div className="rounded-lg border border-info/40 bg-info/10 p-4">
              <h2 className="text-sm font-semibold">Response team notes</h2>
              <p className="mt-1 text-sm text-muted-foreground">{incident.admin_notes}</p>
            </div>
          ) : null}
          {media.length ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Evidence
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {media.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    {item.mime_type.startsWith("image/") ? (
                      <img
                        src={item.url}
                        alt="Incident evidence"
                        loading="lazy"
                        className="h-32 w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-32 items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Paperclip size={16} /> View media
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="gap-3 p-6 text-sm">
          <h2 className="text-lg font-semibold">Report info</h2>
          <Row label="Occurred" value={formatDateTime(incident.occurred_at)} />
          <Row label="Submitted" value={formatDateTime(incident.created_at)} />
          <Row label="Last update" value={formatDateTime(incident.updated_at)} />
          {incident.location ? (
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              {incident.location}
            </p>
          ) : null}
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
