import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Crosshair, Paperclip, SpinnerGap, X } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/phoenix/auth";
import { createIncident, uploadIncidentMedia, validateUpload } from "@/lib/phoenix/api";
import { getCurrentPosition, reverseGeocode } from "@/lib/phoenix/geolocation";
import { INCIDENT_CATEGORIES, labelize } from "@/lib/phoenix/constants";
import type { IncidentCategory } from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/incidents/new")({
  head: () => ({
    meta: [
      { title: "Report an Incident — PHOENIX" },
      { name: "description", content: "Report accidents, crimes, hazards and emergencies with evidence." },
      { property: "og:title", content: "Report an Incident — PHOENIX" },
      { property: "og:description", content: "Submit a detailed incident report with photo or video evidence." },
    ],
  }),
  component: NewIncidentPage,
});

const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  title: z.string().trim().min(5, "Give the report a clear title").max(120),
  description: z.string().trim().min(20, "Describe what happened (20+ characters)").max(2000),
  occurred_at: z.string().min(1, "When did this happen?"),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  additional_details: z.string().trim().max(1000).optional().or(z.literal("")),
});

function NewIncidentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<IncidentCategory>("ACCIDENT");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      setCoords({ latitude: position.latitude, longitude: position.longitude });
      const resolved = await reverseGeocode(position.latitude, position.longitude);
      if (resolved) setAddress(resolved);
      toast.success("Location attached to this report.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not get your location.");
    } finally {
      setLocating(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      try {
        validateUpload(file);
        next.push(file);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invalid file.");
      }
    }
    setFiles((current) => [...current, ...next].slice(0, 5));
  };

  const submit = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const incident = await createIncident(user!.id, {
        category: values.category as IncidentCategory,
        title: values.title,
        description: values.description,
        occurred_at: new Date(values.occurred_at).toISOString(),
        location: values.location ? values.location : address || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        additional_details: values.additional_details ? values.additional_details : null,
      });
      if (files.length) await uploadIncidentMedia(user!.id, incident.id, files);
      return incident;
    },
    onSuccess: (incident) => {
      toast.success(`Report ${incident.reference} submitted.`);
      void queryClient.invalidateQueries({ queryKey: ["incidents"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void navigate({ to: "/incidents/$incidentId", params: { incidentId: incident.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      category,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      occurred_at: String(form.get("occurred_at") ?? ""),
      location: String(form.get("location") ?? ""),
      additional_details: String(form.get("additional_details") ?? ""),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    submit.mutate(parsed.data);
  };

  return (
    <>
      <PageHeader title="Report an incident" description="Give responders the details they need." />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]" noValidate>
        <Card className="gap-5 p-6">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as IncidentCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelize(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input name="title" placeholder="Two-car collision on Bridge Road" maxLength={120} />
            {errors["title"] ? <p className="text-xs text-destructive">{errors["title"]}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              name="description"
              rows={6}
              maxLength={2000}
              placeholder="Describe what happened, who was involved and any injuries…"
            />
            {errors["description"] ? (
              <p className="text-xs text-destructive">{errors["description"]}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>When did it happen?</Label>
              <Input
                name="occurred_at"
                type="datetime-local"
                defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
              />
              {errors["occurred_at"] ? (
                <p className="text-xs text-destructive">{errors["occurred_at"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                name="location"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street, area or landmark"
                maxLength={200}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Additional details (optional)</Label>
            <Textarea name="additional_details" rows={3} maxLength={1000} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="gap-3 p-6">
            <h2 className="text-lg font-semibold">Location</h2>
            <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
              {locating ? <SpinnerGap size={18} className="animate-spin" /> : <Crosshair size={18} />}
              Use my current location
            </Button>
            {coords ? (
              <p className="text-xs text-muted-foreground">
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </p>
            ) : null}
          </Card>

          <Card className="gap-3 p-6">
            <h2 className="text-lg font-semibold">Evidence</h2>
            <p className="text-xs text-muted-foreground">
              Up to 5 photos or videos, 25MB each. Stored privately.
            </p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground">
              <Paperclip size={18} />
              Choose files
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />
            </label>
            {files.length ? (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Button type="submit" className="h-11 w-full text-base" disabled={submit.isPending}>
            {submit.isPending ? <SpinnerGap size={18} className="animate-spin" /> : null}
            Submit report
          </Button>
        </div>
      </form>
    </>
  );
}
