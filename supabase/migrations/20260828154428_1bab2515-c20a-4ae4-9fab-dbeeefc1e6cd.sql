-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','member');
CREATE TYPE public.post_kind AS ENUM ('update','image','video','voice','file','link','email','experiment','announcement');
CREATE TYPE public.attachment_kind AS ENUM ('image','video','audio','document','other');
CREATE TYPE public.experiment_status AS ENUM ('planned','running','pass','fail','needs_review');
CREATE TYPE public.sync_presence AS ENUM ('online','away','offline');

-- ============ SHARED HELPERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  specialization TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  presence public.sync_presence NOT NULL DEFAULT 'offline',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_disabled BOOLEAN NOT NULL DEFAULT false,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "profiles_read_team" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "roles_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ INVITATIONS ============
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  role public.app_role NOT NULL DEFAULT 'member',
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX invitations_token_idx ON public.invitations(token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_admin_all" ON public.invitations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ GROUPS ============
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'hash',
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER groups_touch BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_user_idx ON public.group_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.can_view_group(_group_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = _group_id
      AND (g.is_private = false OR public.is_group_member(g.id) OR public.has_role(auth.uid(),'admin'))
  );
$$;

CREATE POLICY "groups_read" ON public.groups FOR SELECT TO authenticated USING (is_private = false OR public.is_group_member(id) OR public.is_admin());
CREATE POLICY "groups_admin_write" ON public.groups FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "groups_admin_update" ON public.groups FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "groups_admin_delete" ON public.groups FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "group_members_read" ON public.group_members FOR SELECT TO authenticated USING (public.can_view_group(group_id));
CREATE POLICY "group_members_join_self" ON public.group_members FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid() AND public.can_view_group(group_id)) OR public.is_admin());
CREATE POLICY "group_members_update_self" ON public.group_members FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ============ DIRECT CONVERSATIONS ============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_key TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX conversation_participants_user_idx ON public.conversation_participants(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = _conversation_id AND user_id = auth.uid());
$$;

CREATE POLICY "conversations_read" ON public.conversations FOR SELECT TO authenticated USING (public.is_conversation_participant(id));
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE TO authenticated USING (public.is_conversation_participant(id)) WITH CHECK (public.is_conversation_participant(id));

CREATE POLICY "cp_read" ON public.conversation_participants FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id));
CREATE POLICY "cp_insert" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid()));
CREATE POLICY "cp_update_self" ON public.conversation_participants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_single_channel CHECK ((group_id IS NULL) <> (conversation_id IS NULL))
);
CREATE INDEX messages_group_idx ON public.messages(group_id, created_at DESC);
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at DESC);
CREATE INDEX messages_body_idx ON public.messages USING gin (to_tsvector('simple', body));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_read" ON public.messages FOR SELECT TO authenticated USING (
  (group_id IS NOT NULL AND public.can_view_group(group_id))
  OR (conversation_id IS NOT NULL AND public.is_conversation_participant(conversation_id))
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (
    (group_id IS NOT NULL AND public.can_view_group(group_id))
    OR (conversation_id IS NOT NULL AND public.is_conversation_participant(conversation_id))
  )
);
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin());

CREATE TABLE public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  kind public.attachment_kind NOT NULL DEFAULT 'other',
  duration_seconds NUMERIC,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX message_attachments_message_idx ON public.message_attachments(message_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_attachments TO authenticated;
GRANT ALL ON public.message_attachments TO service_role;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_attachments_read" ON public.message_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id));
CREATE POLICY "message_attachments_write" ON public.message_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.author_id = auth.uid()));
CREATE POLICY "message_attachments_delete" ON public.message_attachments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND (m.author_id = auth.uid() OR public.is_admin())));

-- ============ FEED POSTS ============
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.post_kind NOT NULL DEFAULT 'update',
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_idx ON public.posts(created_at DESC);
CREATE INDEX posts_group_idx ON public.posts(group_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "posts_read" ON public.posts FOR SELECT TO authenticated USING (group_id IS NULL OR public.can_view_group(group_id));
CREATE POLICY "posts_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND (group_id IS NULL OR public.can_view_group(group_id)));
CREATE POLICY "posts_update" ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "posts_delete" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin());

CREATE TABLE public.post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  kind public.attachment_kind NOT NULL DEFAULT 'other',
  duration_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX post_attachments_post_idx ON public.post_attachments(post_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_attachments TO authenticated;
GRANT ALL ON public.post_attachments TO service_role;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_attachments_read" ON public.post_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "post_attachments_write" ON public.post_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "post_attachments_delete" ON public.post_attachments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR public.is_admin())));

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX post_comments_post_idx ON public.post_comments(post_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_comments_read" ON public.post_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin());

CREATE TABLE public.post_reactions (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_reactions_read" ON public.post_reactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "post_reactions_insert" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_reactions_delete" ON public.post_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ FILES ============
CREATE TABLE public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_folders TO authenticated;
GRANT ALL ON public.file_folders TO service_role;
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "folders_read" ON public.file_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "folders_insert" ON public.file_folders FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "folders_update" ON public.file_folders FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_admin()) WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY "folders_delete" ON public.file_folders FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_admin());

CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  kind public.attachment_kind NOT NULL DEFAULT 'other',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX files_folder_idx ON public.files(folder_id);
CREATE INDEX files_name_idx ON public.files(name);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated;
GRANT ALL ON public.files TO service_role;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER files_touch BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "files_read" ON public.files FOR SELECT TO authenticated USING (group_id IS NULL OR public.can_view_group(group_id));
CREATE POLICY "files_insert" ON public.files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "files_update" ON public.files FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.is_admin()) WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());
CREATE POLICY "files_delete" ON public.files FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_admin());

-- ============ RESOURCES ============
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER resources_touch BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "resources_read" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "resources_insert" ON public.resources FOR INSERT TO authenticated WITH CHECK (added_by = auth.uid());
CREATE POLICY "resources_update" ON public.resources FOR UPDATE TO authenticated USING (added_by = auth.uid() OR public.is_admin()) WITH CHECK (added_by = auth.uid() OR public.is_admin());
CREATE POLICY "resources_delete" ON public.resources FOR DELETE TO authenticated USING (added_by = auth.uid() OR public.is_admin());

-- ============ EMAILS ============
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags TEXT[] NOT NULL DEFAULT '{}',
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO authenticated;
GRANT ALL ON public.emails TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER emails_touch BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "emails_read" ON public.emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "emails_insert" ON public.emails FOR INSERT TO authenticated WITH CHECK (added_by = auth.uid());
CREATE POLICY "emails_update" ON public.emails FOR UPDATE TO authenticated USING (added_by = auth.uid() OR public.is_admin()) WITH CHECK (added_by = auth.uid() OR public.is_admin());
CREATE POLICY "emails_delete" ON public.emails FOR DELETE TO authenticated USING (added_by = auth.uid() OR public.is_admin());

-- ============ EXPERIMENTS ============
CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status public.experiment_status NOT NULL DEFAULT 'planned',
  environment TEXT,
  soil_type TEXT,
  sensors TEXT[] NOT NULL DEFAULT '{}',
  metrics TEXT[] NOT NULL DEFAULT '{}',
  results TEXT,
  notes TEXT,
  started_on DATE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
GRANT ALL ON public.experiments TO service_role;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER experiments_touch BEFORE UPDATE ON public.experiments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "experiments_read" ON public.experiments FOR SELECT TO authenticated USING (true);
CREATE POLICY "experiments_insert" ON public.experiments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "experiments_update" ON public.experiments FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_admin()) WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "experiments_delete" ON public.experiments FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.is_admin());

CREATE TABLE public.experiment_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX experiment_measurements_exp_idx ON public.experiment_measurements(experiment_id, measured_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiment_measurements TO authenticated;
GRANT ALL ON public.experiment_measurements TO service_role;
ALTER TABLE public.experiment_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measurements_read" ON public.experiment_measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY "measurements_insert" ON public.experiment_measurements FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "measurements_delete" ON public.experiment_measurements FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_admin());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ ACTIVITY LOG ============
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verb TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  summary TEXT NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_log_created_idx ON public.activity_log(created_at DESC);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_read" ON public.activity_log FOR SELECT TO authenticated USING (group_id IS NULL OR public.can_view_group(group_id));
CREATE POLICY "activity_insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ============ REALTIME ============
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.post_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ SEED CHANNELS ============
INSERT INTO public.groups (slug, name, description, icon) VALUES
  ('general','General','Everything that does not fit elsewhere','hash'),
  ('hardware','Hardware','ESP32, sensors, PCB and prototype work','cpu'),
  ('software','Software','PWA, backend and documentation','code'),
  ('ai','AI','Models, datasets and inference','brain'),
  ('agronomy','Agronomy','Soil, crops and field knowledge','sprout'),
  ('experiments','Experiments','Field and lab test coordination','flask-conical'),
  ('partnerships','Partnerships','Incubators, partners and outreach','handshake'),
  ('emails','Emails','Important shared correspondence','mail'),
  ('product','Product','Roadmap and product decisions','compass'),
  ('research','Research','Papers and literature','book-open'),
  ('announcements','Announcements','Team-wide announcements','megaphone');

INSERT INTO public.file_folders (name) VALUES ('Hardware'),('Software'),('Research'),('Business');
