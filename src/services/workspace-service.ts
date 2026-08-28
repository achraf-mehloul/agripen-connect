import { supabase } from "@/integrations/supabase/client";
import type {
  ActivityEntry,
  Experiment,
  ExperimentMeasurement,
  ExperimentStatus,
  Notification,
  Profile,
  Resource,
  WorkspaceEmail,
} from "@/types/domain";

import { fetchProfileMap } from "./hydrate";

/* ---------------------------------- resources --------------------------------- */

export async function fetchResources(search = ""): Promise<Resource[]> {
  let query = supabase.from("resources").select("*").order("created_at", { ascending: false });
  if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createResource(input: {
  clientId: string;
  addedBy: string;
  title: string;
  url: string;
  description: string;
  author?: string | null;
  tags: string[];
  groupId?: string | null;
}): Promise<Resource> {
  const { data: existing } = await supabase
    .from("resources")
    .select("*")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("resources")
    .insert({
      client_id: input.clientId,
      added_by: input.addedBy,
      title: input.title,
      url: input.url,
      description: input.description,
      author: input.author ?? null,
      tags: input.tags,
      group_id: input.groupId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteResource(id: string) {
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ----------------------------------- emails ---------------------------------- */

export async function fetchEmails(search = ""): Promise<WorkspaceEmail[]> {
  let query = supabase.from("emails").select("*").order("received_at", { ascending: false });
  if (search.trim()) query = query.ilike("subject", `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEmail(input: {
  clientId: string;
  addedBy: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  body: string;
  receivedAt: string;
  tags: string[];
  groupId?: string | null;
}): Promise<WorkspaceEmail> {
  const { data: existing } = await supabase
    .from("emails")
    .select("*")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("emails")
    .insert({
      client_id: input.clientId,
      added_by: input.addedBy,
      subject: input.subject,
      sender_name: input.senderName,
      sender_email: input.senderEmail,
      body: input.body,
      received_at: input.receivedAt,
      tags: input.tags,
      group_id: input.groupId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEmail(id: string) {
  const { error } = await supabase.from("emails").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* --------------------------------- experiments -------------------------------- */

export type ExperimentWithOwner = Experiment & { owner: Profile | null };

export async function fetchExperiments(status?: ExperimentStatus): Promise<ExperimentWithOwner[]> {
  let query = supabase.from("experiments").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const profiles = await fetchProfileMap(rows.map((row) => row.owner_id));
  return rows.map((row) => ({ ...row, owner: profiles.get(row.owner_id) ?? null }));
}

export async function fetchExperiment(id: string): Promise<ExperimentWithOwner | null> {
  const { data, error } = await supabase.from("experiments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const profiles = await fetchProfileMap([data.owner_id]);
  return { ...data, owner: profiles.get(data.owner_id) ?? null };
}

export async function createExperiment(input: {
  clientId: string;
  ownerId: string;
  code: string;
  title: string;
  description: string;
  status: ExperimentStatus;
  soilType?: string | null;
  environment?: string | null;
  sensors: string[];
  metrics: string[];
  startedOn?: string | null;
}): Promise<Experiment> {
  const { data: existing } = await supabase
    .from("experiments")
    .select("*")
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("experiments")
    .insert({
      client_id: input.clientId,
      owner_id: input.ownerId,
      code: input.code,
      title: input.title,
      description: input.description,
      status: input.status,
      soil_type: input.soilType ?? null,
      environment: input.environment ?? null,
      sensors: input.sensors,
      metrics: input.metrics,
      started_on: input.startedOn ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateExperiment(id: string, patch: Partial<Experiment>) {
  const { error } = await supabase.from("experiments").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExperiment(id: string) {
  const { error } = await supabase.from("experiments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchMeasurements(experimentId: string): Promise<ExperimentMeasurement[]> {
  const { data, error } = await supabase
    .from("experiment_measurements")
    .select("*")
    .eq("experiment_id", experimentId)
    .order("measured_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addMeasurement(input: {
  experimentId: string;
  createdBy: string;
  metric: string;
  unit: string;
  value: number;
  measuredAt: string;
  note?: string | null;
}) {
  const { error } = await supabase.from("experiment_measurements").insert({
    experiment_id: input.experimentId,
    created_by: input.createdBy,
    metric: input.metric,
    unit: input.unit,
    value: input.value,
    measured_at: input.measuredAt,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

/* -------------------------------- notifications ------------------------------- */

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (ids?.length) query = query.in("id", ids);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

/* ---------------------------------- activity --------------------------------- */

export type ActivityWithActor = ActivityEntry & { actor: Profile | null };

export async function fetchActivity(limit = 30): Promise<ActivityWithActor[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const profiles = await fetchProfileMap(rows.map((row) => row.actor_id));
  return rows.map((row) => ({ ...row, actor: row.actor_id ? profiles.get(row.actor_id) ?? null : null }));
}
