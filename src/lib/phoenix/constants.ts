import type { Database } from "@/integrations/supabase/types";

export type SosStatus = Database["public"]["Enums"]["sos_status"];
export type IncidentStatus = Database["public"]["Enums"]["incident_status"];
export type IncidentCategory = Database["public"]["Enums"]["incident_category"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type EmergencyContact = Database["public"]["Tables"]["emergency_contacts"]["Row"];
export type SosAlert = Database["public"]["Tables"]["sos_alerts"]["Row"];
export type EmergencyAlert = Database["public"]["Tables"]["emergency_alerts"]["Row"];
export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentMedia = Database["public"]["Tables"]["incident_media"]["Row"];
export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

export const SOS_STATUSES: SosStatus[] = [
  "ACTIVE",
  "ACKNOWLEDGED",
  "RESPONDING",
  "RESOLVED",
  "CANCELLED",
];

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  "ACCIDENT",
  "THEFT",
  "FIRE",
  "HARASSMENT",
  "SUSPICIOUS_ACTIVITY",
  "MEDICAL_EMERGENCY",
  "ROAD_HAZARD",
  "MISSING_PERSON",
  "OTHER",
];

export const EMERGENCY_TYPES = [
  "GENERAL",
  "MEDICAL",
  "FIRE",
  "CRIME",
  "ACCIDENT",
  "NATURAL_DISASTER",
] as const;

export const RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Spouse",
  "Child",
  "Relative",
  "Friend",
  "Neighbour",
  "Colleague",
  "Doctor",
  "Other",
] as const;

export function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const SOS_STATUS_TONE: Record<SosStatus, "emergency" | "warning" | "info" | "success" | "muted"> = {
  ACTIVE: "emergency",
  ACKNOWLEDGED: "warning",
  RESPONDING: "info",
  RESOLVED: "success",
  CANCELLED: "muted",
};

export const INCIDENT_STATUS_TONE: Record<
  IncidentStatus,
  "emergency" | "warning" | "info" | "success" | "muted"
> = {
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  ACKNOWLEDGED: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  REJECTED: "emergency",
};

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(value);
}
