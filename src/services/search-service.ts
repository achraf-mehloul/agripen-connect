import { supabase } from "@/integrations/supabase/client";
import { fullName } from "@/lib/format";
import type { SearchResult } from "@/types/domain";

/** Cross-module search used by the command palette and the search route. */
export async function searchWorkspace(term: string): Promise<SearchResult[]> {
  const query = term.trim();
  if (query.length < 2) return [];
  const like = `%${query}%`;

  const [posts, messages, files, profiles, groups, emails, experiments, resources] =
    await Promise.all([
      supabase.from("posts").select("id, title, body, created_at").ilike("body", like).limit(6),
      supabase
        .from("messages")
        .select("id, body, created_at, group_id, conversation_id")
        .ilike("body", like)
        .is("deleted_at", null)
        .limit(6),
      supabase.from("files").select("id, name, mime_type, created_at").ilike("name", like).limit(6),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, job_title")
        .or(`first_name.ilike.${like},last_name.ilike.${like},job_title.ilike.${like}`)
        .limit(6),
      supabase.from("groups").select("id, name, slug, description").ilike("name", like).limit(6),
      supabase
        .from("emails")
        .select("id, subject, sender_name, received_at")
        .ilike("subject", like)
        .limit(6),
      supabase
        .from("experiments")
        .select("id, code, title, created_at")
        .or(`title.ilike.${like},code.ilike.${like}`)
        .limit(6),
      supabase.from("resources").select("id, title, url, created_at").ilike("title", like).limit(6),
    ]);

  const results: SearchResult[] = [];

  for (const row of posts.data ?? [])
    results.push({
      id: row.id,
      kind: "post",
      title: row.title || "Feed update",
      subtitle: row.body.slice(0, 90),
      href: "/feed",
      timestamp: row.created_at,
    });

  for (const row of messages.data ?? [])
    results.push({
      id: row.id,
      kind: "message",
      title: "Message",
      subtitle: row.body.slice(0, 90),
      href: row.group_id ? "/chat" : "/messages",
      timestamp: row.created_at,
    });

  for (const row of files.data ?? [])
    results.push({
      id: row.id,
      kind: "file",
      title: row.name,
      subtitle: row.mime_type,
      href: "/files",
      timestamp: row.created_at,
    });

  for (const row of profiles.data ?? [])
    results.push({
      id: row.id,
      kind: "profile",
      title: fullName(row.first_name, row.last_name),
      subtitle: row.job_title || "Team member",
      href: `/team/${row.id}`,
      timestamp: null,
    });

  for (const row of groups.data ?? [])
    results.push({
      id: row.id,
      kind: "group",
      title: row.name,
      subtitle: row.description || "Team group",
      href: `/chat/${row.slug}`,
      timestamp: null,
    });

  for (const row of emails.data ?? [])
    results.push({
      id: row.id,
      kind: "email",
      title: row.subject,
      subtitle: `From ${row.sender_name}`,
      href: "/emails",
      timestamp: row.received_at,
    });

  for (const row of experiments.data ?? [])
    results.push({
      id: row.id,
      kind: "experiment",
      title: row.title,
      subtitle: row.code,
      href: `/experiments/${row.id}`,
      timestamp: row.created_at,
    });

  for (const row of resources.data ?? [])
    results.push({
      id: row.id,
      kind: "resource",
      title: row.title,
      subtitle: row.url,
      href: "/resources",
      timestamp: row.created_at,
    });

  return results;
}
