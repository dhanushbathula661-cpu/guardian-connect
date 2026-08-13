import { supabase } from "@/integrations/supabase/client";
import type {
  AppNotification,
  EmergencyContact,
  Incident,
  IncidentCategory,
  IncidentMedia,
  IncidentStatus,
  Profile,
  SosAlert,
  SosStatus,
} from "./constants";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "./constants";

function unwrap<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data as NonNullable<T>;
}

function maybe<T>(result: { data: T; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? null;
}

/* ---------------------------------- profile --------------------------------- */

export async function getProfile(userId: string): Promise<Profile | null> {
  return maybe(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle());
}

export async function updateProfile(
  userId: string,
  values: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>,
): Promise<Profile> {
  return unwrap(
    await supabase.from("profiles").update(values).eq("id", userId).select("*").single(),
  );
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  validateUpload(file, ["image/jpeg", "image/png", "image/webp"], 5 * 1024 * 1024);
  const path = `${userId}/${crypto.randomUUID()}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedUrl(bucket: string, path: string, seconds = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/* ----------------------------- emergency contacts ---------------------------- */

export async function listContacts(userId: string): Promise<EmergencyContact[]> {
  return unwrap(
    await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("priority", { ascending: true }),
  );
}

export type ContactInput = {
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  priority: number;
  is_primary: boolean;
};

export async function createContact(userId: string, input: ContactInput) {
  if (input.is_primary) await clearPrimary(userId);
  return unwrap(
    await supabase
      .from("emergency_contacts")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single(),
  );
}

export async function updateContact(userId: string, id: string, input: ContactInput) {
  if (input.is_primary) await clearPrimary(userId);
  return unwrap(
    await supabase.from("emergency_contacts").update(input).eq("id", id).select("*").single(),
  );
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function clearPrimary(userId: string) {
  await supabase
    .from("emergency_contacts")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .eq("is_primary", true);
}

/* ------------------------------------ SOS ----------------------------------- */

export interface SosInput {
  emergency_type: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  message: string | null;
}

export async function createSos(userId: string, input: SosInput): Promise<SosAlert> {
  const contacts = await listContacts(userId);
  const alert = unwrap(
    await supabase
      .from("sos_alerts")
      .insert({ ...input, user_id: userId, contacts_notified: contacts.length })
      .select("*")
      .single(),
  );

  await supabase.from("sos_status_history").insert({
    sos_id: alert.id,
    status: "ACTIVE",
    note: `SOS activated. ${contacts.length} emergency contact(s) notified.`,
    changed_by: userId,
  });

  await createNotification(userId, {
    type: "SOS",
    title: "Emergency SOS activated",
    message: `Your SOS alert is live. ${contacts.length} emergency contact(s) were notified with your location.`,
    link: `/sos`,
  });

  // Development notification channel — see README for wiring real SMS/email.
  await notifyContacts(alert, contacts);
  return alert;
}

/**
 * DEVELOPMENT notifier. Real deployments should replace this with an SMS/email
 * provider call (see README → "Replacing the development notifier").
 */
async function notifyContacts(alert: SosAlert, contacts: EmergencyContact[]) {
  if (!contacts.length) return;
  console.info(
    "[phoenix:dev-notifier] SOS %s dispatched to %s",
    alert.id,
    contacts.map((contact) => `${contact.name} <${contact.phone}>`).join(", "),
  );
}

export async function listMySos(userId: string): Promise<SosAlert[]> {
  return unwrap(
    await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function getActiveSos(userId: string): Promise<SosAlert | null> {
  return maybe(
    await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["ACTIVE", "ACKNOWLEDGED", "RESPONDING"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function getSos(id: string): Promise<SosAlert | null> {
  return maybe(await supabase.from("sos_alerts").select("*").eq("id", id).maybeSingle());
}

export async function listSosHistory(sosId: string) {
  return unwrap(
    await supabase
      .from("sos_status_history")
      .select("*")
      .eq("sos_id", sosId)
      .order("created_at", { ascending: true }),
  );
}

export async function updateSosStatus(
  alert: SosAlert,
  status: SosStatus,
  note: string | null,
  actorId: string,
) {
  const closing = status === "RESOLVED" || status === "CANCELLED";
  const patch = {
    status,
    ...(closing ? { resolved_at: new Date().toISOString() } : {}),
    ...(closing && note ? { resolution_notes: note } : {}),
  };
  const updated = unwrap(
    await supabase.from("sos_alerts").update(patch).eq("id", alert.id).select("*").single(),
  );
  await supabase.from("sos_status_history").insert({
    sos_id: alert.id,
    status,
    note,
    changed_by: actorId,
  });
  await createNotification(alert.user_id, {
    type: "STATUS_UPDATE",
    title: `SOS ${status.toLowerCase()}`,
    message: note ?? `Your SOS alert status changed to ${status}.`,
    link: "/sos",
  });
  return updated;
}

/* --------------------------------- incidents -------------------------------- */

export interface IncidentInput {
  category: IncidentCategory;
  title: string;
  description: string;
  occurred_at: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  additional_details: string | null;
}

export async function createIncident(userId: string, input: IncidentInput): Promise<Incident> {
  const incident = unwrap(
    await supabase
      .from("incidents")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single(),
  );
  await createNotification(userId, {
    type: "INCIDENT",
    title: "Incident report submitted",
    message: `Report ${incident.reference} was submitted and is awaiting review.`,
    link: `/incidents/${incident.id}`,
  });
  return incident;
}

export function validateUpload(
  file: File,
  allowed: string[] = ALLOWED_UPLOAD_TYPES,
  maxBytes: number = MAX_UPLOAD_BYTES,
) {
  if (!allowed.includes(file.type)) {
    throw new Error(`${file.name}: unsupported file type (${file.type || "unknown"}).`);
  }
  if (file.size > maxBytes) {
    throw new Error(`${file.name}: file is larger than ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  }
  if (!/\.[a-z0-9]{2,5}$/i.test(file.name)) {
    throw new Error(`${file.name}: missing a valid file extension.`);
  }
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
}

export async function uploadIncidentMedia(userId: string, incidentId: string, files: File[]) {
  for (const file of files) {
    validateUpload(file);
    const path = `${userId}/${incidentId}/${crypto.randomUUID()}-${sanitizeName(file.name)}`;
    const { error } = await supabase.storage.from("incident-media").upload(path, file);
    if (error) throw new Error(error.message);
    const inserted = await supabase.from("incident_media").insert({
      incident_id: incidentId,
      user_id: userId,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }
}

export async function listMyIncidents(userId: string): Promise<Incident[]> {
  return unwrap(
    await supabase
      .from("incidents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function getIncident(id: string): Promise<Incident | null> {
  return maybe(await supabase.from("incidents").select("*").eq("id", id).maybeSingle());
}

export async function listIncidentMedia(incidentId: string): Promise<IncidentMedia[]> {
  return unwrap(
    await supabase
      .from("incident_media")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true }),
  );
}

export async function updateIncident(id: string, input: Partial<IncidentInput>) {
  return unwrap(await supabase.from("incidents").update(input).eq("id", id).select("*").single());
}

export async function deleteIncident(id: string) {
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateIncidentStatus(
  incident: Incident,
  status: IncidentStatus,
  adminNotes: string | null,
) {
  const updated = unwrap(
    await supabase
      .from("incidents")
      .update({ status, admin_notes: adminNotes })
      .eq("id", incident.id)
      .select("*")
      .single(),
  );
  await createNotification(incident.user_id, {
    type: "STATUS_UPDATE",
    title: `Report ${incident.reference} updated`,
    message: adminNotes
      ? `Status: ${status}. ${adminNotes}`
      : `Your report status changed to ${status}.`,
    link: `/incidents/${incident.id}`,
  });
  return updated;
}

/* ------------------------------- notifications ------------------------------ */

export async function createNotification(
  userId: string,
  input: { type: AppNotification["type"]; title: string; message: string; link?: string | null },
) {
  const { error } = await supabase.from("notifications").insert({ ...input, user_id: userId });
  if (error) console.error("[phoenix] notification failed:", error.message);
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  return unwrap(
    await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
  );
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw new Error(error.message);
}

/* ----------------------------------- admin ---------------------------------- */

export async function adminListUsers(): Promise<Profile[]> {
  return unwrap(
    await supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  );
}

export async function adminListRoles() {
  return unwrap(await supabase.from("user_roles").select("user_id, role"));
}

export async function adminSetUserActive(userId: string, isActive: boolean) {
  return unwrap(
    await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", userId)
      .select("*")
      .single(),
  );
}

export async function adminListIncidents(): Promise<Incident[]> {
  return unwrap(
    await supabase.from("incidents").select("*").order("created_at", { ascending: false }),
  );
}

export async function adminListSos(): Promise<SosAlert[]> {
  return unwrap(
    await supabase.from("sos_alerts").select("*").order("created_at", { ascending: false }),
  );
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  totalIncidents: number;
  pendingIncidents: number;
  resolvedIncidents: number;
  activeSos: number;
  totalSos: number;
  users: Profile[];
  incidents: Incident[];
  alerts: SosAlert[];
}

export async function adminDashboard(): Promise<AdminDashboard> {
  const [users, incidents, alerts] = await Promise.all([
    adminListUsers(),
    adminListIncidents(),
    adminListSos(),
  ]);
  return {
    users,
    incidents,
    alerts,
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.is_active).length,
    totalIncidents: incidents.length,
    pendingIncidents: incidents.filter(
      (incident) => !["RESOLVED", "REJECTED"].includes(incident.status),
    ).length,
    resolvedIncidents: incidents.filter((incident) => incident.status === "RESOLVED").length,
    activeSos: alerts.filter((alert) =>
      ["ACTIVE", "ACKNOWLEDGED", "RESPONDING"].includes(alert.status),
    ).length,
    totalSos: alerts.length,
  };
}

export interface UserDashboard {
  incidents: Incident[];
  alerts: SosAlert[];
  contacts: EmergencyContact[];
  notifications: AppNotification[];
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  activeSos: number;
}

export async function userDashboard(userId: string): Promise<UserDashboard> {
  const [incidents, alerts, contacts, notifications] = await Promise.all([
    listMyIncidents(userId),
    listMySos(userId),
    listContacts(userId),
    listNotifications(userId),
  ]);
  return {
    incidents,
    alerts,
    contacts,
    notifications,
    totalReports: incidents.length,
    pendingReports: incidents.filter(
      (incident) => !["RESOLVED", "REJECTED"].includes(incident.status),
    ).length,
    resolvedReports: incidents.filter((incident) => incident.status === "RESOLVED").length,
    activeSos: alerts.filter((alert) =>
      ["ACTIVE", "ACKNOWLEDGED", "RESPONDING"].includes(alert.status),
    ).length,
  };
}
