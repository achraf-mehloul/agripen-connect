import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const redeemSchema = z.object({
  token: z.string().trim().min(8).max(128),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  jobTitle: z.string().trim().max(80).default(""),
  specialization: z.string().trim().max(80).default(""),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

/**
 * Invitation-only registration. Runs with elevated privileges because the
 * invitation token is the only credential the visitor has: it validates the
 * token, creates the confirmed account, seeds the profile and role, then burns
 * the token so the same link cannot be reused.
 */
export const redeemInvitation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => redeemSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();

    if (inviteError) throw new Error("We could not verify that invitation. Please try again.");
    if (!invitation) throw new Error("This invitation link is not valid.");
    if (invitation.used_at) throw new Error("This invitation has already been used.");
    if (invitation.revoked_at) throw new Error("This invitation was revoked by an administrator.");
    if (new Date(invitation.expires_at).getTime() < Date.now())
      throw new Error("This invitation has expired. Ask an administrator for a new one.");

    const email = data.email.toLowerCase();
    if (invitation.email && invitation.email.toLowerCase() !== email)
      throw new Error("This invitation was issued for a different email address.");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { first_name: data.firstName, last_name: data.lastName },
    });
    if (createError || !created.user)
      throw new Error(createError?.message ?? "The account could not be created.");

    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      first_name: data.firstName,
      last_name: data.lastName,
      job_title: data.jobTitle,
      specialization: data.specialization,
      date_of_birth: data.dateOfBirth ? data.dateOfBirth : null,
      onboarded: true,
    });
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: invitation.role }, { onConflict: "user_id,role" });

    await supabaseAdmin
      .from("invitations")
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq("id", invitation.id);

    const { data: groups } = await supabaseAdmin.from("groups").select("id").eq("is_private", false);
    if (groups?.length) {
      await supabaseAdmin
        .from("group_members")
        .upsert(
          groups.map((group) => ({ group_id: group.id, user_id: userId })),
          { onConflict: "group_id,user_id" },
        );
    }

    await supabaseAdmin.from("activity_log").insert({
      actor_id: userId,
      verb: "joined",
      entity_type: "profile",
      entity_id: userId,
      summary: `${data.firstName} ${data.lastName} joined the AgriPen team`,
    });

    return { ok: true as const, email };
  });

/**
 * Idempotently provisions the configured administrator account from server
 * secrets so the very first sign-in works without a bootstrap invitation.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const adminEmail = process.env["ADMIN_EMAIL"];
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (!adminEmail || !adminPassword) return { ready: false as const };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = adminEmail.toLowerCase();

  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);
  if (existingRole?.length) return { ready: true as const };

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { first_name: "AgriPen", last_name: "Admin" },
  });

  let userId = created?.user?.id;
  if (!userId) {
    if (!error) return { ready: false as const };
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users.find((user) => user.email?.toLowerCase() === email)?.id;
    if (!userId) return { ready: false as const };
  }

  await supabaseAdmin.from("profiles").upsert({
    id: userId,
    first_name: "AgriPen",
    last_name: "Admin",
    job_title: "Team lead",
    specialization: "Coordination",
    onboarded: true,
  });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  const { data: groups } = await supabaseAdmin.from("groups").select("id");
  if (groups?.length) {
    await supabaseAdmin
      .from("group_members")
      .upsert(
        groups.map((group) => ({ group_id: group.id, user_id: userId })),
        { onConflict: "group_id,user_id" },
      );
  }

  return { ready: true as const };
});
