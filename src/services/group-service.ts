import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/ids";
import type { Group, Profile } from "@/types/domain";

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("is_archived", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchGroupBySlug(slug: string): Promise<Group | null> {
  const { data, error } = await supabase.from("groups").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchGroupMembers(groupId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => row.user_id);
  if (!ids.length) return [];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);
  if (profileError) throw new Error(profileError.message);
  return profiles ?? [];
}

export async function fetchMyGroupIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.group_id);
}

export async function joinGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, user_id: userId }, { onConflict: "group_id,user_id" });
  if (error) throw new Error(error.message);
}

export async function leaveGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function createGroup(input: {
  name: string;
  description: string;
  icon: string;
  isPrivate: boolean;
  createdBy: string;
}): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      icon: input.icon,
      is_private: input.isPrivate,
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGroup(groupId: string, patch: Partial<Group>): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .update(patch)
    .eq("id", groupId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);
}

export async function markGroupRead(groupId: string, userId: string) {
  await supabase
    .from("group_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("user_id", userId);
}
