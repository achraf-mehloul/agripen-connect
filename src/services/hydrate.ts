import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/domain";

/**
 * Author columns reference `auth.users`, so PostgREST cannot embed profiles
 * directly. This helper batches one profile lookup per list instead.
 */
export async function fetchProfileMap(userIds: (string | null)[]): Promise<Map<string, Profile>> {
  const unique = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  if (!unique.length) return new Map();
  const { data, error } = await supabase.from("profiles").select("*").in("id", unique);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}
