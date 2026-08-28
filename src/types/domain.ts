import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type AppRole = Enums["app_role"];
export type PostKind = Enums["post_kind"];
export type AttachmentKind = Enums["attachment_kind"];
export type ExperimentStatus = Enums["experiment_status"];
export type PresenceState = Enums["sync_presence"];

export type Profile = Tables["profiles"]["Row"];
export type Group = Tables["groups"]["Row"];
export type GroupMember = Tables["group_members"]["Row"];
export type Conversation = Tables["conversations"]["Row"];
export type MessageRow = Tables["messages"]["Row"];
export type MessageAttachment = Tables["message_attachments"]["Row"];
export type PostRow = Tables["posts"]["Row"];
export type PostAttachment = Tables["post_attachments"]["Row"];
export type PostComment = Tables["post_comments"]["Row"];
export type PostReaction = Tables["post_reactions"]["Row"];
export type FileFolder = Tables["file_folders"]["Row"];
export type WorkspaceFile = Tables["files"]["Row"];
export type Resource = Tables["resources"]["Row"];
export type WorkspaceEmail = Tables["emails"]["Row"];
export type Experiment = Tables["experiments"]["Row"];
export type ExperimentMeasurement = Tables["experiment_measurements"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type ActivityEntry = Tables["activity_log"]["Row"];
export type Invitation = Tables["invitations"]["Row"];

/** Author-hydrated variants used across the UI. */
export type WithAuthor<T> = T & { author: Profile | null };

export type FeedPost = PostRow & {
  author: Profile | null;
  group: Pick<Group, "id" | "name" | "slug" | "icon"> | null;
  attachments: PostAttachment[];
  comments: { count: number };
  reactions: PostReaction[];
  pending?: boolean;
};

export type ChatMessage = MessageRow & {
  author: Profile | null;
  attachments: MessageAttachment[];
  pending?: boolean;
  failed?: boolean;
};

export type DirectConversation = {
  conversation: Conversation;
  partner: Profile;
  lastMessage: MessageRow | null;
  unread: number;
};

export type NewAttachmentInput = {
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  kind: AttachmentKind;
  duration_seconds?: number | null;
};

export type SearchResultKind =
  | "post"
  | "message"
  | "file"
  | "profile"
  | "group"
  | "email"
  | "experiment"
  | "resource";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
  timestamp: string | null;
};
