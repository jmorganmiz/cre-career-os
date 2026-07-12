-- One-time CareerOS owner migration.
--
-- 1. Sign in once through Supabase Auth.
-- 2. Find your auth user id:
--    select id, email from auth.users order by created_at desc;
-- 3. Replace the value below and run the full transaction.
--
-- Rollback, if needed:
--   run the same UPDATE statements in reverse, setting user_id back to
--   '00000000-0000-0000-0000-000000000001' where user_id = target_user_id.

begin;

do $$
declare
  legacy_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  target_user_id_text text := 'REPLACE_WITH_SUPABASE_AUTH_USER_ID';
  target_user_id uuid;
begin
  if target_user_id_text = ('REPLACE_WITH_' || 'SUPABASE_AUTH_USER_ID') then
    raise exception 'Replace target_user_id_text with your real Supabase Auth user id before running this migration';
  end if;

  target_user_id := target_user_id_text::uuid;

  if target_user_id = legacy_owner_id then
    raise exception 'target_user_id must be your real Supabase Auth user id, not the legacy owner id';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target_user_id % does not exist in auth.users', target_user_id;
  end if;

  if exists (select 1 from firms where user_id = target_user_id)
    or exists (select 1 from contacts where user_id = target_user_id)
    or exists (select 1 from applications where user_id = target_user_id)
    or exists (select 1 from research_runs where user_id = target_user_id)
    or exists (select 1 from opportunity_runs where user_id = target_user_id)
    or exists (select 1 from activity_log where user_id = target_user_id)
    or exists (select 1 from automation_settings where user_id = target_user_id)
    or exists (select 1 from automation_runs where user_id = target_user_id)
    or exists (select 1 from automation_results where user_id = target_user_id)
  then
    raise exception 'target_user_id % already owns CareerOS rows; stop and reconcile before migrating legacy data', target_user_id;
  end if;

  update firms set user_id = target_user_id where user_id = legacy_owner_id;
  update contacts set user_id = target_user_id where user_id = legacy_owner_id;
  update applications set user_id = target_user_id where user_id = legacy_owner_id;
  update research_runs set user_id = target_user_id where user_id = legacy_owner_id;
  update opportunity_runs set user_id = target_user_id where user_id = legacy_owner_id;
  update activity_log set user_id = target_user_id where user_id = legacy_owner_id;
  update automation_settings set user_id = target_user_id where user_id = legacy_owner_id;
  update automation_runs set user_id = target_user_id where user_id = legacy_owner_id;
  update automation_results set user_id = target_user_id where user_id = legacy_owner_id;
end $$;

commit;
