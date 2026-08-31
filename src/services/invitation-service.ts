import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Invitation } from "@/types/domain";

export async function fetchInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function createToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createInvitation(input: {
  createdBy: string;
  email?: string | null;
  role: AppRole;
  note?: string | null;
  expiresInDays: number;
}): Promise<Invitation> {
  const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      created_by: input.createdBy,
      email: input.email?.trim() ? input.email.trim().toLowerCase() : null,
      role: input.role,
      note: input.note ?? null,
      token: createToken(),
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function revokeInvitation(id: string) {
  const { error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function invitationLink(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/invite/${token}`;
}


export function invitationStatus(invitation: Invitation): "used" | "revoked" | "expired" | "active" {
  if (invitation.used_at) return "used";
  if (invitation.revoked_at) return "revoked";
  if (new Date(invitation.expires_at).getTime() < Date.now()) return "expired";
  return "active";
}
