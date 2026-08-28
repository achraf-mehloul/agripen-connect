import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/types/domain";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchTeam(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("first_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.role);
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function touchPresence(userId: string, presence: Profile["presence"]) {
  await supabase
    .from("profiles")
    .update({ presence, last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}
