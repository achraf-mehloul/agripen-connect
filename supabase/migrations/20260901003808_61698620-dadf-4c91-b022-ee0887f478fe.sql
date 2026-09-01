DROP POLICY IF EXISTS conversations_read ON public.conversations;
CREATE POLICY conversations_read ON public.conversations FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_conversation_participant(id));

DROP POLICY IF EXISTS cp_insert ON public.conversation_participants;
CREATE POLICY cp_insert ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid()) OR user_id = auth.uid());